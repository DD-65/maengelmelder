import { useInput } from "../hooks/useInput"
import { rooms } from "../constants/rooms";
// import "../../index.css"

type InputFormProperties = {
  onIssueCreated: () => void;
};

//  Ort Eingabe zerschossen, dropdwn geht nicht zu
export function InputForm({onIssueCreated}: InputFormProperties){
  const{title, setTitle,description, setDescription, location, setLocation, kategorie, setKategorie, setImage, addIssue}=useInput(onIssueCreated);
  const filteredRooms = rooms.filter(room => room.toLowerCase().includes(location.toLowerCase()));  // hier hin gebaut, da nur hier genutzt

    return(
          <form className="issue-form" onSubmit={addIssue}>
            <input type="text" placeholder="Titel" value={title} onChange={(event) => setTitle(event.target.value)} />

            <div className="location-wrapper">
              <input type="text" placeholder="Ort" value={location} onChange={(event) => setLocation(event.target.value)} autoComplete="off" />

              {location.length > 0 && filteredRooms.length > 0 && (
                <div className="room-suggestions">
                  {filteredRooms
                    .filter(room => room !== location)
                    .slice(0, 6)
                    .map((room) => (
                      <div
                        key={room}
                        className="room-item"
                        onClick={() => setLocation(room)}
                      >
                        {room}
                      </div>
                    ))}
                </div>
              )}
            </div>

            <select value={kategorie} onChange={(event) => setKategorie(event.target.value)}>
              <option value="">Kategorie wählen</option>
              <option value="Steckdose">Steckdose</option>
              <option value="Schlagloch">Schlagloch</option>
              <option value="WLAN">WLAN</option>
              <option value="Mobiliar">Mobiliar</option>
              <option value="Andere">Andere</option>  {/* Als Option, wie gewollt */}
            </select>
            <input type="file" accept="image/*" onChange={(event) => setImage(event.target.files ? event.target.files[0] : null)} />
            <textarea className="beschreibung-input" placeholder="Beschreibung des Mangels" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={200} />

            <button type="submit">Posten</button>
          </form>
    )
}
