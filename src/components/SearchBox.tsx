"use client";

import { useEffect, useRef, useState } from "react";

interface SearchBoxProps {
    onSelect: (location: google.maps.LatLngLiteral, name: string) => void;
}

const SearchBox = ({ onSelect }: SearchBoxProps) => {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [selectedPlace, setSelectedPlace] = useState<{ location: google.maps.LatLngLiteral; name: string } | null>(null);

    useEffect(() => {
        if (!inputRef.current) return;

        const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
            types: ["geocode"],
        });

        autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (place.geometry && place.geometry.location) {
                setSelectedPlace({
                    location: {
                        lat: place.geometry.location.lat(),
                        lng: place.geometry.location.lng(),
                    },
                    name: place.formatted_address || place.name || "Adresse inconnue",
                });
            }
        });
    }, []);

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === "Enter" && selectedPlace) {
            event.preventDefault();
            onSelect(selectedPlace.location, selectedPlace.name);
            inputRef.current!.value = ""; // Réinitialiser l'input après l'ajout
            setSelectedPlace(null); // Réinitialiser la sélection
        }
    };

    return <input ref={inputRef} type="text" placeholder="Saisissez une adresse et appuyez sur Entrée" className="w-full p-2 border rounded text-black" onKeyDown={handleKeyDown} />;
};

export { SearchBox };
