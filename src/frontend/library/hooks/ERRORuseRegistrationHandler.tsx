import { useRegistrationLogin } from "./useRegistrationLogin";
import { useLoadIssues } from "./useLoadIssues";
import { useIssueList } from "./useIssueList";

export function useRegistrationHandler(){
    const{userId, setUserId, userEmail, setUserEmail, userRole, setUserRole, emailVerified, setEmailVerified,
        authView, setAuthView, authEmail, setAuthEmail,authPassword, setAuthPassword,
        registerAsAdmin, setRegisterAsAdmin, adminCode, setAdminCode, authError, setAuthError, authMessage, setAuthMessage,
        voteError, setVoteError, settingsOpen, setSettingsOpen, settingsMessage, setSettingsMessage, settingsError, setSettingsError
    }=useRegistrationLogin(); 
    const{setIssueList}=useIssueList();
    const{loadIssues}=useLoadIssues(setIssueList);

    
    const register = async (event: React.FormEvent) => {
      event.preventDefault();
      setAuthError("");
      setAuthMessage("");
      
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: authEmail,
          password: authPassword,
          adminSecret: registerAsAdmin ? adminCode : undefined,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setAuthError(data.error || "Registrierung fehlgeschlagen");
        return;
      }
      
      setAuthEmail("");
      setAuthPassword("");
      setAdminCode("");
      setRegisterAsAdmin(false);
      setAuthMessage(data.message || "Registrierung erfolgreich. Bitte bestätige deine E-Mail-Adresse.");
      setAuthView("login");
    };

    return{register};
}