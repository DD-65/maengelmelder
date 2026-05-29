interface KommentarProperties{
    commentStatus:string;
    commentInhalt:string;
    commentKommentator: string;
}
export function Kommentar({ commentStatus, commentInhalt, commentKommentator}: KommentarProperties){
    return(
        <li className="singleComment">
            <span className="kommentator">{commentKommentator}    </span>
            <span className="status">
                {commentStatus}    
            </span>
            <span className="inhalt">{commentInhalt}</span>
        </li>
        
    );
}