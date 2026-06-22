import { Issue } from '../types/Issue';
import { toast } from 'react-toastify';

export function useReactions(issue: Issue, setIssueList: React.Dispatch<React.SetStateAction<Issue[]>>) {
  
  const toggleReaction = async (clickedEmoji: string) => {
    const isRemoving = issue.user_reaction === clickedEmoji;
    const payloadEmoji = isRemoving ? null : clickedEmoji;

    // Instant UI Update instead of pulling from the server
    setIssueList(prevList => prevList.map(item => {
      if (item.id === issue.id) {
        let newReactions = [...(item.reactions || [])];

        // Decrement old reaction if they had one
        if (item.user_reaction) {
          const oldReaction = newReactions.find(r => r.emoji === item.user_reaction);
          if (oldReaction) oldReaction.count -= 1;
        }

        // Increment new reaction if they aren't just removing
        if (!isRemoving) {
          const newReaction = newReactions.find(r => r.emoji === clickedEmoji);
          if (newReaction) newReaction.count += 1;
          else newReactions.push({ emoji: clickedEmoji, count: 1 });
        }

        // Clean up 0 counts and re-sort highest to lowest
        newReactions = newReactions.filter(r => r.count > 0).sort((a, b) => b.count - a.count);

        return { ...item, reactions: newReactions, user_reaction: payloadEmoji };
      }
      return item;
    }));

    // Server Update
    try {
      const res = await fetch(`/api/mangel/${issue.id}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji: payloadEmoji })
      });

      if (!res.ok) {
        throw new Error("Fehler beim Speichern");
      }
    } catch (error) {
      toast.error("🫪 Netzwerkfehler beim Speichern der Reaktion");
    }
  };

  return { toggleReaction };
}