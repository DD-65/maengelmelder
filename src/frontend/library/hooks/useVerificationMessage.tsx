import { useState } from "react";
export function useVerificationMessage(){
    const [verificationMessage, setVerificationMessage] = useState("");
    const [verificationMessageType, setVerificationMessageType] = useState<"success" | "error" | "info">("info");
    return{verificationMessage, setVerificationMessage, verificationMessageType, setVerificationMessageType};
}