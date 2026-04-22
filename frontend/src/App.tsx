import { useState } from 'react';

// Define all issue components
type Issue = {
  title: string;
  description: string;
  location: string;
}

export default function App() {

  // Input
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');

  // List of issues
  const [issueList, setIssueList] = useState<Issue[]>([]);

  // Add issue to list
  const addIssue = (event: React.SubmitEvent) => {

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

    // Add Issue to Array
    setIssueList([...issueList, newIssue]); 

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
          <div style={{border: '2px solid black', margin: '10px', padding: '10px', width: '30%'}} key={index}>
            <li key={index}>
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