import { useState } from 'react';
export function useInput(){
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [kategorie, setKategorie] = useState('');
    const [image, setImage] = useState<File | null>(null);
    return{title, setTitle,description, setDescription, location, setLocation, kategorie, setKategorie, image, setImage}
}