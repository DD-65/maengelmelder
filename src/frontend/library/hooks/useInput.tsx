import { useState } from 'react';
export function useInput(loadIssues: () => void | Promise<void>) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [kategorie, setKategorie] = useState('');
    const [image, setImage] = useState<File | null>(null);

    //addIssue 

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
    await loadIssues();

    // Clear Input
    setTitle('');
    setDescription('');
    setLocation('');
    setKategorie('');
    setImage(null);
  }


    return{title, setTitle,description, setDescription, location, setLocation, kategorie, setKategorie, image, setImage, addIssue}
}
