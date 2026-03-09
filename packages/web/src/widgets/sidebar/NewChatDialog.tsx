import * as React from "react";
import { Search, UserPlus, X, Hash } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "../../shared/lib/utils";
import { apiSlice } from "../../shared/api/apiSlice";

interface NewChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewChatDialog({ isOpen, onClose }: NewChatDialogProps) {
  const [query, setQuery] = React.useState("");
  const { data: searchResults, isLoading } = apiSlice.useSearchUsersQuery(
    query,
    {
      skip: query.length < 2,
    },
  );
  const [createChat, { isLoading: isCreating }] =
    apiSlice.useCreateChatMutation();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isOpen) {
      setQuery("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartChat = async (userId: string, handle: string) => {
    try {
      // Create a direct chat. The backend might just create it or return existing if DMs are unique per pair
      const chat = await createChat({ type: "direct", name: handle }).unwrap();
      navigate(`/channels/${chat.id}`);
      onClose();
    } catch (error) {
      console.error("Failed to create chat:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-terminal-950/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-terminal-900 border border-terminal-800 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-terminal-800 bg-terminal-950/50">
          <div className="flex items-center gap-2 text-terminal-100 font-bold">
            <UserPlus size={18} className="text-terminal-400" />
            <span>New Direct Message</span>
          </div>
          <button
            onClick={onClose}
            className="text-terminal-500 hover:text-terminal-300 transition-colors p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-terminal-800/50">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-terminal-500"
              size={18}
            />
            <input
              type="text"
              autoFocus
              placeholder="Search users by handle or ID..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-terminal-950 border border-terminal-800 rounded-md py-2.5 pl-10 pr-4 text-terminal-100 placeholder:text-terminal-600 focus:outline-none focus:border-terminal-500 transition-colors"
            />
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 min-h-[200px]">
          {query.length < 2 ? (
            <div className="h-full flex flex-col items-center justify-center text-terminal-500 pt-8 pb-4 text-sm">
              <Hash size={32} className="opacity-20 mb-3" />
              <p>Type at least 2 characters to search</p>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center pt-8 pb-4 text-terminal-500 text-sm">
              <span className="animate-pulse">
                Searching the SENTRY database...
              </span>
            </div>
          ) : searchResults && searchResults.length > 0 ? (
            <div className="space-y-1">
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleStartChat(user.id, user.handle)}
                  disabled={isCreating}
                  className="w-full flex items-center justify-between p-3 rounded-md hover:bg-terminal-800/50 text-left transition-colors group disabled:opacity-50"
                >
                  <div>
                    <div className="font-bold text-terminal-100 group-hover:text-terminal-50 transition-colors">
                      {user.displayName || user.handle}
                    </div>
                    <div className="text-xs text-terminal-500 mt-0.5 font-mono">
                      @{user.handle}
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="text-xs bg-terminal-500/20 text-terminal-300 px-2 py-1 rounded">
                      Message
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-terminal-500 pt-8 pb-4 text-sm">
              <p>No operatives found matching "{query}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
