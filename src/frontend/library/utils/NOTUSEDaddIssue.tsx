import { useInput } from "../hooks/useInput"

interface AddIssueProperties{
    title: string
    description: string
    location :string
    kategorie: string
    image: File
}

export function addIssue({title, description, location, kategorie, image}:AddIssueProperties){
    const{setTitle, setDescription, setLocation, setKategorie, setImage}=useInput();
    //const{title, setTitle,description, setDescription, location, setLocation, kategorie, setKategorie, image, setImage}=useInput();

    const addIssue = async (event: React.SubmitEvent) => {
        // Stops refreshing
        event.preventDefault();
        
        // Dont add empty issue to Array
        if (title === '') return;
        
        // Combine into new Issue
        const formData = new FormData();
        formData.append("title", title);
        formData.append("description", description);
        formData.append("location", location);
        formData.append("kategorie", kategorie);
        if (image) {
            formData.append("image", image);
        }
        
        // issue in db speichern und dann neu laden
        await fetch('/api/mangel', {
            method: 'POST',
            body: formData,
        });
        
        // Reload aus db
        loadIssues();
        
        // Clear Input
        setTitle('');
        setDescription('');
        setLocation('');
        setKategorie('');
        setImage(null);
    }
}