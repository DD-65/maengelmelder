import { useState } from 'react';
import { useEffect } from 'react';

// Define all issue components
type Issue = {
  id?: number;
  title: string;
  description: string | null;
  location: string | null;
  created_at?: string;
}

export default function App() {

  // Input
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');

  // List of issues
  const [issueList, setIssueList] = useState<Issue[]>([]);

  // issues aus db laden
  useEffect(() => {
       fetch('http://localhost:3001/api/mangel')
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
      location: location
    };

    // issue in db speichern und dann neu laden
    await fetch('http://localhost:3001/api/mangel', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(newIssue),
     });

    // Reload aus db
    fetch('http://localhost:3001/api/mangel')
      .then((res) => res.json())
      .then((data) => setIssueList(data));

    // Clear Input
    setTitle(''); 
    setDescription(''); 
    setLocation('');
  }

  // UI
  return (
    <div>
      <h1>RPTU-Mängelmelder</h1>

      {/* Input form */}
      <form onSubmit={addIssue} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px', margin: '0 auto' }}>

        <input type="text" placeholder="Title" value={title} onChange={(event) => setTitle(event.target.value)}/>
        <input type="text" placeholder="Beschreibung" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={200}/>
        <input type="text" placeholder="Ort" value={location} onChange={(event) => setLocation(event.target.value)}/>

        <button type="submit">Hinzufügen</button>
      </form>

      {/* List of issues */}
      <ul style={{ listStyleType: 'none', padding: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        {issueList.map((issue, index) => (
          <div style={{backgroundColor: '#f0f0f0', margin: '10px', width: '30%', borderRadius: '10px'}} key={index}>
            <li key={index}>
            <div style={{position: 'relative', top: '-10px', left: '-10px', backgroundColor: 'darkblue', color: 'white', borderRadius: '50%', width: '30px', height: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>{index + 1}</div>
            <h3>{issue.title}</h3>
            <p>{issue.description}</p>
            <p>{issue.location}</p>
            </li>
          </div>
          
        ))}
      </ul>

    </div>


  );

}