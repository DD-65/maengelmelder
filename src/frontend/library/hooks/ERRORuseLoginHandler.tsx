import { useRegistrationLogin } from "./useRegistrationLogin";
import { useLoadIssues } from "./useLoadIssues";
import { useIssueList } from "./useIssueList";

export function useLoginHandler(){
    const{userId, setUserId, userEmail, setUserEmail, userRole, setUserRole, emailVerified, setEmailVerified,
        authView, setAuthView, authEmail, setAuthEmail,authPassword, setAuthPassword,
        registerAsAdmin, setRegisterAsAdmin, adminCode, setAdminCode, authError, setAuthError, authMessage, setAuthMessage,
        voteError, setVoteError, settingsOpen, setSettingsOpen, settingsMessage, setSettingsMessage, settingsError, setSettingsError
    }=useRegistrationLogin(); 
    const{setIssueList}=useIssueList();
    const{loadIssues}=useLoadIssues(setIssueList);

    
    const login = async (event: React.FormEvent) => {
      event.preventDefault();
      setAuthError("");
      setAuthMessage("");
      
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: authEmail,
          password: authPassword,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setAuthError(data.error || "Login fehlgeschlagen");
        return;
      }
      
      setUserId(data.userId);
      setUserEmail(data.email);
      setUserRole(data.role || "user");
      setEmailVerified(Boolean(data.emailVerified));
      setAuthEmail("");
      setAuthPassword("");
      setAuthView(null);
      loadIssues(false);
    };

return{login};
}