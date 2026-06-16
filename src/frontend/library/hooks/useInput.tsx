import { useState } from 'react';
import type { SubmitEvent } from 'react';

export function useInput(loadIssues: () => void | Promise<void>) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [kategorie, setKategorie] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [isPrivate, setIsPrivate] = useState(false);

    //addIssue 

    const addIssue = async (event: React.SubmitEvent) => {
    // Stops refreshing
    event.preventDefault();

    // Dont add empty issue to Array
    if (title === '') return;

    // Combine into new Issue
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description.slice(0, 200)); // Kills everything after 200 chars
    formData.append("location", location);
    formData.append("kategorie", kategorie);
    formData.append("isPrivate", isPrivate ? "1" : "0");
    if (image) {
      formData.append("image", image);
    }

    // issue in db speichern und dann neu laden
    const res = await fetch('/api/mangel', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(data?.error || "Fehler beim Speichern des Mangels");
    }

    // Reload aus db
    await loadIssues();

    // Clear Input
    setTitle('');
    setDescription('');
    setLocation('');
    setKategorie('');
    setImage(null);
    setIsPrivate(false);
  }


    return{title, setTitle,description, setDescription, location, setLocation, kategorie, setKategorie, image, setImage, addIssue, isPrivate, setIsPrivate}
}
