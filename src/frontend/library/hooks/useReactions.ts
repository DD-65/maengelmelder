import { Issue } from '../types/Issue';
import { toast } from 'react-toastify';

export function useReactions(issue: Issue, setIssueList: React.Dispatch<React.SetStateAction<Issue[]>>) {
  
  const addReaction = async (emoji: string) => {
    // This fucntion instantly updates the UI with the new reaction, instead of waiting for the server response
    setIssueList(prevList => prevList.map(item => {
      if (item.id === issue.id) {
        const currentReactions = [...(item.reactions || [])];
        const existingEmojiIndex = currentReactions.findIndex(r => r.emoji === emoji);

        if (existingEmojiIndex !== -1) {
          currentReactions[existingEmojiIndex].count += 1;
        } else {
          currentReactions.push({ emoji, count: 1 });
        }

        return { ...item, reactions: currentReactions };
      }
      return item;
    }));

    // This function acutally saves the reaction to the server
    try {
      const res = await fetch(`/api/mangel/${issue.id}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji })
      });

      if (!res.ok) {
        throw new Error("Fehler beim Speichern");
      }
    } catch (error) {
      toast.error("🫪 Netzwerkfehler beim Speichern der Reaktion");
    }
  };

  return { addReaction };
}