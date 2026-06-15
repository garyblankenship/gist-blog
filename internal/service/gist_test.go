package service

import (
	"context"
	"errors"
	"os"
	"strings"
	"testing"

	"gist/internal/domain"
)

// --- fakes ---

type fakeRepo struct {
	all          []domain.Gist
	allErr       error
	byID         *domain.Gist
	byIDErr      error
	createErr    error
	created      []*domain.Gist
	getAllCalled bool
}

func (f *fakeRepo) GetAll(context.Context) ([]domain.Gist, error) {
	f.getAllCalled = true
	return f.all, f.allErr
}
func (f *fakeRepo) GetByID(context.Context, domain.GistID) (*domain.Gist, error) {
	return f.byID, f.byIDErr
}
func (f *fakeRepo) Create(_ context.Context, g *domain.Gist) error {
	f.created = append(f.created, g)
	if f.createErr != nil {
		return f.createErr
	}
	g.ID = "newgistid123"
	return nil
}
func (f *fakeRepo) Update(context.Context, *domain.Gist) error { return nil }

type fakeCache struct {
	gists   []domain.Gist
	getErr  error
	stale   bool
	saveErr error
	saved   []domain.Gist
	cleared bool
}

func (f *fakeCache) GetGists() ([]domain.Gist, error) { return f.gists, f.getErr }
func (f *fakeCache) SaveGists(g []domain.Gist) error {
	f.saved = g
	return f.saveErr
}
func (f *fakeCache) IsStale() bool { return f.stale }
func (f *fakeCache) Clear() error  { f.cleared = true; return nil }

type fakeFS struct {
	files map[string][]byte
	sizes map[string]int64
}

func (f *fakeFS) Exists(path string) bool { _, ok := f.files[path]; return ok }
func (f *fakeFS) ReadFile(path string) ([]byte, error) {
	b, ok := f.files[path]
	if !ok {
		return nil, os.ErrNotExist
	}
	return b, nil
}
func (f *fakeFS) Size(path string) (int64, error) {
	if s, ok := f.sizes[path]; ok {
		return s, nil
	}
	b, ok := f.files[path]
	if !ok {
		return 0, os.ErrNotExist
	}
	return int64(len(b)), nil
}
func (f *fakeFS) WriteFile(string, []byte) error { return nil }
func (f *fakeFS) RemoveAll(string) error         { return nil }

func newSvc(repo *fakeRepo, cache *fakeCache, fs *fakeFS) *GistService {
	return NewGistService(repo, cache, fs, &domain.Config{})
}

// --- PublishFiles ---

func TestPublishFiles_Success(t *testing.T) {
	repo := &fakeRepo{}
	fs := &fakeFS{files: map[string][]byte{"a.md": []byte("hello")}}
	svc := newSvc(repo, &fakeCache{}, fs)

	id, err := svc.PublishFiles(context.Background(), []string{"a.md"}, "desc", true)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if id != "newgistid123" {
		t.Errorf("expected newgistid123, got %q", id)
	}
	if len(repo.created) != 1 {
		t.Fatalf("expected 1 gist created, got %d", len(repo.created))
	}
	g := repo.created[0]
	if g.Description != "desc" || !g.Public {
		t.Errorf("unexpected gist metadata: %+v", g)
	}
	if len(g.Files) != 1 {
		t.Fatalf("expected 1 file, got %d", len(g.Files))
	}
	if gf, ok := g.Files["a.md"]; !ok || gf.Content != "hello" {
		t.Errorf("file content mismatch: %+v", g.Files)
	}
}

func TestPublishFiles_FileNotFound(t *testing.T) {
	svc := newSvc(&fakeRepo{}, &fakeCache{}, &fakeFS{files: map[string][]byte{}})

	_, err := svc.PublishFiles(context.Background(), []string{"missing.md"}, "d", true)
	var nf domain.ErrFileNotFound
	if !errors.As(err, &nf) {
		t.Fatalf("expected domain.ErrFileNotFound, got %v", err)
	}
	if nf.Path != "missing.md" {
		t.Errorf("expected path missing.md, got %q", nf.Path)
	}
}

func TestPublishFiles_TooLarge(t *testing.T) {
	fs := &fakeFS{
		files: map[string][]byte{"big.bin": []byte("x")},
		sizes: map[string]int64{"big.bin": maxGistFileSize + 1},
	}
	svc := newSvc(&fakeRepo{}, &fakeCache{}, fs)

	_, err := svc.PublishFiles(context.Background(), []string{"big.bin"}, "d", false)
	if err == nil {
		t.Fatal("expected error for oversized file")
	}
	if !strings.Contains(err.Error(), "too large") {
		t.Errorf("expected 'too large' in error, got %v", err)
	}
}

func TestPublishFiles_CreateError(t *testing.T) {
	repo := &fakeRepo{createErr: errors.New("api down")}
	fs := &fakeFS{files: map[string][]byte{"a.md": []byte("hi")}}
	svc := newSvc(repo, &fakeCache{}, fs)

	_, err := svc.PublishFiles(context.Background(), []string{"a.md"}, "d", true)
	if err == nil || !strings.Contains(err.Error(), "create gist") {
		t.Fatalf("expected 'create gist' wrapping error, got %v", err)
	}
}

// --- ListGists ---

func TestListGists_CacheHit(t *testing.T) {
	cached := []domain.Gist{{ID: "cached1", Description: "c"}}
	repo := &fakeRepo{}
	cache := &fakeCache{stale: false, gists: cached}
	svc := newSvc(repo, cache, &fakeFS{})

	got, err := svc.ListGists(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(got) != 1 || string(got[0].ID) != "cached1" {
		t.Errorf("expected cached gist, got %+v", got)
	}
	if repo.getAllCalled {
		t.Error("repo.GetAll should NOT be called on cache hit")
	}
}

func TestListGists_CacheStaleFetchesAndSaves(t *testing.T) {
	fetched := []domain.Gist{{ID: "fresh1"}}
	repo := &fakeRepo{all: fetched}
	cache := &fakeCache{stale: true}
	svc := newSvc(repo, cache, &fakeFS{})

	got, err := svc.ListGists(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(got) != 1 || string(got[0].ID) != "fresh1" {
		t.Errorf("expected fetched gist, got %+v", got)
	}
	if !repo.getAllCalled {
		t.Error("repo.GetAll should be called when cache stale")
	}
	if len(cache.saved) != 1 {
		t.Errorf("expected fetched gists saved to cache, got %d", len(cache.saved))
	}
}

func TestListGists_FetchError(t *testing.T) {
	repo := &fakeRepo{allErr: errors.New("boom")}
	cache := &fakeCache{stale: true}
	svc := newSvc(repo, cache, &fakeFS{})

	_, err := svc.ListGists(context.Background())
	if err == nil || !strings.Contains(err.Error(), "fetch gists") {
		t.Fatalf("expected 'fetch gists' wrapping error, got %v", err)
	}
}

func TestListGists_SaveErrorNonFatal(t *testing.T) {
	fetched := []domain.Gist{{ID: "x"}}
	repo := &fakeRepo{all: fetched}
	cache := &fakeCache{stale: true, saveErr: errors.New("disk full")}
	svc := newSvc(repo, cache, &fakeFS{})

	got, err := svc.ListGists(context.Background())
	if err != nil {
		t.Fatalf("save error must be non-fatal: %v", err)
	}
	if len(got) != 1 {
		t.Errorf("expected fetched gists despite save error, got %d", len(got))
	}
}

// --- SyncGists ---

func TestSyncGists_ClearsThenFetches(t *testing.T) {
	fetched := []domain.Gist{{ID: "synced1"}}
	repo := &fakeRepo{all: fetched}
	cache := &fakeCache{stale: true}
	svc := newSvc(repo, cache, &fakeFS{})

	got, err := svc.SyncGists(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !cache.cleared {
		t.Error("expected cache to be cleared before fetch")
	}
	if len(got) != 1 || string(got[0].ID) != "synced1" {
		t.Errorf("expected fetched gist, got %+v", got)
	}
}

// --- GetGist ---

func TestGetGist_InvalidID(t *testing.T) {
	svc := newSvc(&fakeRepo{}, &fakeCache{}, &fakeFS{})

	_, err := svc.GetGist(context.Background(), "")
	var invalid domain.ErrInvalidGistID
	if !errors.As(err, &invalid) {
		t.Fatalf("expected domain.ErrInvalidGistID, got %v", err)
	}
}

func TestGetGist_Success(t *testing.T) {
	want := &domain.Gist{ID: "abc123", Description: "g"}
	repo := &fakeRepo{byID: want}
	svc := newSvc(repo, &fakeCache{}, &fakeFS{})

	got, err := svc.GetGist(context.Background(), "abc123")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got == nil || string(got.ID) != "abc123" {
		t.Errorf("expected abc123 gist, got %+v", got)
	}
}
