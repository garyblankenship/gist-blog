package commands

import (
	"context"
	"fmt"
	"strings"
	"time"

	"gist/internal/domain"
	"gist/internal/service"

	"github.com/charmbracelet/bubbles/list"
	"github.com/charmbracelet/bubbles/spinner"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

// TuiCommand handles the 'tui' command for interactive gist management
type TuiCommand struct {
	service *service.GistService
}

// NewTuiCommand creates a new TUI command
func NewTuiCommand(service *service.GistService) *TuiCommand {
	return &TuiCommand{
		service: service,
	}
}

// Name returns the command name
func (c *TuiCommand) Name() string {
	return "tui"
}

// Usage returns the usage string
func (c *TuiCommand) Usage() string {
	return "Interactive TUI for managing gists"
}

// Execute runs the TUI command
func (c *TuiCommand) Execute(ctx context.Context, args []string) error {
	p := tea.NewProgram(
		newModel(c.service),
		tea.WithAltScreen(),
	)
	
	if _, err := p.Run(); err != nil {
		return fmt.Errorf("error running TUI: %w", err)
	}
	
	return nil
}

// gistItem implements list.Item interface
type gistItem struct {
	gist domain.Gist
}

func (i gistItem) Title() string {
	title := i.gist.Description
	if title == "" {
		// Use first filename if no description
		for filename := range i.gist.Files {
			title = filename
			break
		}
	}
	return title
}

func (i gistItem) Description() string {
	var parts []string
	
	// Visibility
	if i.gist.Public {
		parts = append(parts, "🌐 Public")
	} else {
		parts = append(parts, "🔒 Private")
	}
	
	// File count
	parts = append(parts, fmt.Sprintf("%d file(s)", len(i.gist.Files)))
	
	// Created date
	parts = append(parts, i.gist.CreatedAt.Format("2006-01-02"))
	
	return strings.Join(parts, " • ")
}

func (i gistItem) FilterValue() string {
	return i.Title()
}

// Messages
type gistsMsg []domain.Gist
type errorMsg error
type successMsg string
type toggledMsg struct {
	gistID string
	public bool
}

// Model represents the TUI state
type model struct {
	service       *service.GistService
	list          list.Model
	gists         []domain.Gist
	loading       bool
	spinner       spinner.Model
	err           error
	status        string
	statusTimer   *time.Timer
}

// Styles
var (
	titleStyle = lipgloss.NewStyle().
		Bold(true).
		Foreground(lipgloss.Color("230")).
		Background(lipgloss.Color("62")).
		Padding(0, 1)
	
	statusStyle = lipgloss.NewStyle().
		Foreground(lipgloss.Color("241"))
	
	successStyle = lipgloss.NewStyle().
		Foreground(lipgloss.Color("42"))
	
	errorStyle = lipgloss.NewStyle().
		Foreground(lipgloss.Color("196"))
	
	helpStyle = lipgloss.NewStyle().
		Foreground(lipgloss.Color("241"))
)

func newModel(service *service.GistService) model {
	// Initialize list
	items := []list.Item{}
	l := list.New(items, list.NewDefaultDelegate(), 0, 0)
	l.Title = "Gist Manager"
	l.SetShowStatusBar(false)
	l.SetFilteringEnabled(true)
	l.Styles.Title = titleStyle
	
	// Initialize spinner
	s := spinner.New()
	s.Spinner = spinner.Dot
	s.Style = lipgloss.NewStyle().Foreground(lipgloss.Color("205"))
	
	return model{
		service: service,
		list:    l,
		loading: true,
		spinner: s,
	}
}

func (m model) Init() tea.Cmd {
	return tea.Batch(
		m.loadGists(),
		m.spinner.Tick,
	)
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.list.SetSize(msg.Width, msg.Height-3) // Leave room for status
		
	case tea.KeyMsg:
		if m.loading {
			return m, nil
		}
		
		switch msg.String() {
		case "q", "ctrl+c":
			return m, tea.Quit
			
		case "enter", " ":
			// Toggle visibility
			if i, ok := m.list.SelectedItem().(gistItem); ok {
				return m, m.toggleVisibility(i.gist)
			}
			
		case "r":
			// Refresh
			m.loading = true
			return m, tea.Batch(
				m.loadGists(),
				m.spinner.Tick,
			)
			
		case "?":
			// Show help
			m.status = "Keys: [Enter] Toggle visibility • [r] Refresh • [q] Quit"
			return m, m.clearStatusAfter(5 * time.Second)
		}
		
	case gistsMsg:
		m.loading = false
		m.gists = msg
		items := make([]list.Item, len(msg))
		for i, g := range msg {
			items[i] = gistItem{gist: g}
		}
		m.list.SetItems(items)
		m.status = fmt.Sprintf("Loaded %d gists", len(msg))
		return m, m.clearStatusAfter(2 * time.Second)
		
	case toggledMsg:
		// Update the gist in our list
		for i, g := range m.gists {
			if g.ID.String() == msg.gistID {
				m.gists[i].Public = msg.public
				items := make([]list.Item, len(m.gists))
				for j, gist := range m.gists {
					items[j] = gistItem{gist: gist}
				}
				m.list.SetItems(items)
				break
			}
		}
		
		visibility := "private"
		if msg.public {
			visibility = "public"
		}
		m.status = fmt.Sprintf("✓ Gist updated to %s", visibility)
		return m, m.clearStatusAfter(3 * time.Second)
		
	case successMsg:
		m.status = string(msg)
		return m, m.clearStatusAfter(3 * time.Second)
		
	case errorMsg:
		m.err = msg
		m.status = fmt.Sprintf("Error: %v", msg)
		return m, m.clearStatusAfter(5 * time.Second)
		
	case spinner.TickMsg:
		if m.loading {
			var cmd tea.Cmd
			m.spinner, cmd = m.spinner.Update(msg)
			return m, cmd
		}
		
	case clearStatusMsg:
		m.status = ""
		return m, nil
	}
	
	// Update list
	var cmd tea.Cmd
	m.list, cmd = m.list.Update(msg)
	return m, cmd
}

func (m model) View() string {
	if m.loading {
		return fmt.Sprintf("\n  %s Loading gists...\n", m.spinner.View())
	}
	
	// Main list view
	view := m.list.View()
	
	// Status line
	statusLine := "\n"
	if m.status != "" {
		if m.err != nil {
			statusLine += errorStyle.Render(m.status)
		} else if strings.HasPrefix(m.status, "✓") {
			statusLine += successStyle.Render(m.status)
		} else {
			statusLine += statusStyle.Render(m.status)
		}
	} else {
		statusLine += helpStyle.Render("[↑/↓] Navigate • [Enter] Toggle visibility • [r] Refresh • [?] Help • [q] Quit")
	}
	
	return view + statusLine
}

// Commands
func (m model) loadGists() tea.Cmd {
	return func() tea.Msg {
		ctx := context.Background()
		gists, err := m.service.ListGists(ctx)
		if err != nil {
			return errorMsg(err)
		}
		return gistsMsg(gists)
	}
}

func (m model) toggleVisibility(gist domain.Gist) tea.Cmd {
	return func() tea.Msg {
		ctx := context.Background()
		
		// Toggle the visibility
		gist.Public = !gist.Public
		
		// Update on GitHub
		err := m.service.UpdateGist(ctx, gist.ID, gist)
		if err != nil {
			return errorMsg(fmt.Errorf("failed to update gist: %w", err))
		}
		
		return toggledMsg{
			gistID: gist.ID.String(),
			public: gist.Public,
		}
	}
}

type clearStatusMsg struct{}

func (m model) clearStatusAfter(d time.Duration) tea.Cmd {
	return tea.Tick(d, func(time.Time) tea.Msg {
		return clearStatusMsg{}
	})
}