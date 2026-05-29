 import React from "react";
 import { useState, useEffect } from "react";
 import { useRegistrationLogin } from "../hooks/useRegistrationLogin";
 import { useRegistrationHandler} from "../hooks/ERRORuseRegistrationHandler";
 import { useLoginHandler } from "../hooks/ERRORuseLoginHandler";

interface RegistrationLoginProperties{
    authView:"login" | "register" | null;
    authEmail: string;
    setAuthEmail: React.Dispatch<React.SetStateAction<string>>;
    authPassword: string;
    setAuthPassword: React.Dispatch<React.SetStateAction<string>>;
    registerAsAdmin: boolean;
    setRegisterAsAdmin: React.Dispatch<React.SetStateAction<boolean>>;
    adminCode: string;
    setAdminCode: React.Dispatch<React.SetStateAction<string>>;
    authError: string;
    authMessage: string
}

export function RegistrationLogin({authView, authEmail, setAuthEmail,authPassword, setAuthPassword,
     registerAsAdmin, setRegisterAsAdmin, adminCode, setAdminCode, authError, authMessage}: RegistrationLoginProperties){

        //const{login}=useLoginHandler();
        //const{register}=useRegistrationHandler();  // Für die auskommentierte Version unten
        

    // const{userId, setUserId, userEmail, setUserEmail, userRole, setUserRole, emailVerified, setEmailVerified,
    //     authView, setAuthView, authEmail, setAuthEmail,authPassword, setAuthPassword,
    //     registerAsAdmin, setRegisterAsAdmin, adminCode, setAdminCode, authError, setAuthError, authMessage, setAuthMessage,
    //     voteError, setVoteError, settingsOpen, setSettingsOpen, settingsMessage, setSettingsMessage, settingsError, setSettingsError
    // }=useRegistrationLogin();                
    //                                  Vll. brauchen wir das, wenn in App kein useRegistrationLogin mehr verwendet wird

    return (
        <form
            className="auth-card"
            //onSubmit={authView === "login" ? login : register}>  Die Getter und Setter, über die Johannes gesprochen hat?
            onSubmit={authView === "login" ? useLoginHandler().login : useRegistrationHandler().register}>
                
            <h2>{authView === "login" ? "Login" : "Registrieren"}</h2>

            <input
              type="email"
              placeholder="Email"
              value={authEmail}
              onChange={(event) => setAuthEmail(event.target.value)}
            />

            <input
              type="password"
              placeholder="Passwort"
              value={authPassword}
              onChange={(event) => setAuthPassword(event.target.value)}
            />

            {authView === "register" && (
              <div className="admin-checkbox">
                <input
                  type="checkbox"
                  id="registerAsAdmin"
                  checked={registerAsAdmin}
                  onChange={(e) => setRegisterAsAdmin(e.target.checked)}
                />
                <label htmlFor="registerAsAdmin">als Admin registrieren</label>
              </div>
            )}

            {authView === "register" && registerAsAdmin && (
              <input
                type="password"
                placeholder="Admin-Code"
                value={adminCode}
                onChange={(event) => setAdminCode(event.target.value)}
              />
            )}

            {authError && <p className="error-text">{authError}</p>}
            {authMessage && <p className="success-text">{authMessage}</p>}

            <button type="submit">
              {authView === "login" ? "Einloggen" : "Registrieren"}
            </button>
          </form>
    );
}