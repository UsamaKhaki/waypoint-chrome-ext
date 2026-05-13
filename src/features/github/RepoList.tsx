import { useState } from 'react';
import { Star, Trash2, Plus, GitBranch, ExternalLink } from 'lucide-react';
import { useGitHubStore } from '@/store/github.store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';

export function RepoList() {
  const { repos, addRepo, removeRepo, toggleStarRepo } = useGitHubStore();
  const [isAdding, setIsAdding] = useState(false);
  const [repoInput, setRepoInput] = useState('');
  const [error, setError] = useState('');

  const handleAdd = async () => {
    const trimmed = repoInput.trim();
    if (!trimmed) return setError('Enter a repo (owner/repo)');
    const parts = trimmed.replace('https://github.com/', '').split('/');
    if (parts.length < 2) return setError('Format: owner/repo or full GitHub URL');
    const [owner, name] = parts;
    await addRepo({
      owner,
      name,
      fullName: `${owner}/${name}`,
      url: `https://github.com/${owner}/${name}`,
      isStarred: false,
    });
    setRepoInput('');
    setError('');
    setIsAdding(false);
  };

  const sorted = [...repos].sort((a, b) => (b.isStarred ? 1 : 0) - (a.isStarred ? 1 : 0));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="section-title">Saved Repositories</p>
        <Button variant="ghost" size="sm" onClick={() => setIsAdding(true)}>
          <Plus className="h-3.5 w-3.5" /> Add Repo
        </Button>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-6 text-sm text-muted">
          No repos saved. Add your frequently used repositories.
        </div>
      ) : (
        <div className="space-y-1.5">
          {sorted.map((repo) => (
            <div
              key={repo.id}
              className="group flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-elevated transition-colors"
            >
              <GitBranch className="h-4 w-4 text-muted flex-shrink-0" />
              <button
                onClick={() => chrome.tabs.create({ url: repo.url })}
                className="flex-1 text-sm text-secondary hover:text-accent transition-colors text-left truncate"
              >
                {repo.fullName}
              </button>
              {repo.description && (
                <span className="text-xs text-muted hidden lg:block truncate max-w-[200px]">
                  {repo.description}
                </span>
              )}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => chrome.tabs.create({ url: repo.url })}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => toggleStarRepo(repo.id)}
                  className={repo.isStarred ? 'text-warning' : ''}
                >
                  <Star className={cn('h-3.5 w-3.5', repo.isStarred && 'fill-warning')} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="hover:text-destructive"
                  onClick={() => removeRepo(repo.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isAdding} onClose={() => setIsAdding(false)} title="Add Repository" size="sm">
        <div className="space-y-3">
          <Input
            placeholder="owner/repo or GitHub URL"
            value={repoInput}
            onChange={(e) => setRepoInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            autoFocus
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd}>Add</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
