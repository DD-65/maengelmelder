import { useState } from 'react';
export function useRegistrationLogin(){
    const [userId, setUserId] = useState<number | null>(null);
    const [userEmail, setUserEmail] = useState("");
    const [userRole, setUserRole] = useState("");
    const [emailVerified, setEmailVerified] = useState(false);
    const [authView, setAuthView] = useState<"login" | "register" | null>(null);
    const [authEmail, setAuthEmail] = useState("");
    const [authPassword, setAuthPassword] = useState("");
    // const [registerAsAdmin, setRegisterAsAdmin] = useState(false); wird zukünftig von superadmin rolle gesetzt
    // const [adminCode, setAdminCode] = useState("");
    const [authError, setAuthError] = useState("");
    const [authMessage, setAuthMessage] = useState("");
    const [voteError, setVoteError] = useState("");
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [settingsMessage, setSettingsMessage] = useState("");
    const [settingsError, setSettingsError] = useState("");

    
    return{userId, setUserId, userEmail, setUserEmail, userRole, setUserRole, emailVerified, setEmailVerified,
        authView, setAuthView, authEmail, setAuthEmail,authPassword, setAuthPassword,
        // registerAsAdmin, setRegisterAsAdmin, adminCode, setAdminCode, 
        authError, setAuthError, authMessage, setAuthMessage,
        voteError, setVoteError, settingsOpen, setSettingsOpen, settingsMessage, setSettingsMessage, settingsError, setSettingsError
    }
}