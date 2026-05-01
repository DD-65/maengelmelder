import { useState } from 'react';
import { useEffect } from 'react';

// Define all issue components
type Issue = {
  id?: number;
  title: string;
  description: string | null;
  location: string | null;
  created_at?: string;
  votes?: number;
  kategorie: string;
}

export default function App() {

  // Input
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [kategorie, setKategorie] = useState('');

  // List of issues
  const [issueList, setIssueList] = useState<Issue[]>([]);

  // issues aus db laden
  useEffect(() => {
       fetch('/api/mangel')
         .then((res) => res.json())
         .then((data) => setIssueList(data));
     }, []);

  // Add issue to list
  const addIssue = async (event: React.SubmitEvent) => {

    // Stops refreshing
    event.preventDefault(); 

    // Dont add empty issue to Array
    if (title === '') return; 

    // Combine into new Issue
    const newIssue: Issue = {
      title: title,
      description: description,
      location: location,
      kategorie: kategorie
    };

    // issue in db speichern und dann neu laden
    await fetch('/api/mangel', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(newIssue),
     });

    // Reload aus db
    fetch('/api/mangel')
      .then((res) => res.json())
      .then((data) => setIssueList(data));

    // Clear Input
    setTitle(''); 
    setDescription(''); 
    setLocation('');
    setKategorie('');
  }

  const upvoteIssue = async (id: number) => {
    // request
    await fetch(`/api/mangel/${id}/vote`, {method: 'PATCH',});

    // reload
    fetch('/api/mangel')
      .then((res) => res.json())
      .then((data) => setIssueList(data));
  };

  // UI
  return (
    <div>
      <h1>RPTU-Mängelmelder</h1>

      {/* Input form 
      
      */}
      <form onSubmit={addIssue} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px', margin: '0 auto' }}>

        <input type="text" placeholder="Title" value={title} onChange={(event) => setTitle(event.target.value)}/>
        <input type="text" placeholder="Beschreibung" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={200}/>
        {/*<input type= />*/}
        <input type="text" placeholder="Ort" value={location} onChange={(event) => setLocation(event.target.value)}/>
        <select value={kategorie} onChange={(event) => setKategorie(event.target.value)}>
          <option value=''></option>
          <option value="Steckdose">Steckdose</option>
          <option value="Schlagloch">Schlagloch</option>
          <option value="WLAN">WLAN</option>
          <option value="Mobiliar">Mobiliar</option>
        </select>
        <button type="submit">Hinzufügen</button>
      </form>

      {/* List of issues */}
      <ul style={{ listStyleType: 'none', padding: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        {issueList.map((issue, index) => (
          <div style={{backgroundColor: '#f0f0f0', margin: '10px', width: '30%', borderRadius: '10px'}} key={index}>
            <li key={index}>
            <div style={{position: 'relative', top: '-10px', left: '-10px', backgroundColor: 'darkblue', color: 'white', borderRadius: '50%', width: '30px', height: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>{index + 1}</div>
            <h3>{issue.title}</h3>
            <p><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ verticalAlign: 'text-bottom', marginRight: '4px' }} aria-hidden="true"><path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z" /></svg>{issue.location}</p>
            <p>{issue.description}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
              <p>Likes: {issue.votes || 0}</p>
              <p>Kategorie: {issue.kategorie || '-' }</p>
              <button onClick={() => {if (issue.id) upvoteIssue(issue.id);}}> Like </button>
            </div>
            </li>
          </div>
        ))}
      </ul>

    </div>


  );

}
