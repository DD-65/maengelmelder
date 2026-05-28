interface KommentarProperties{
    key: number;
    commentStatus:string;
    commentInhalt:string;
    commentKommentator: string;
}
export function Kommentar({key, commentStatus, commentInhalt, commentKommentator}: KommentarProperties){
    return(
        <li><span>{commentKommentator}    </span>
            {commentStatus && (
                <span>{commentStatus}    </span>
            )}
            <span>{commentInhalt}</span>
        </li>
        
    );
}