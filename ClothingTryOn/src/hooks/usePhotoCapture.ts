import {useState, useCallback} from 'react';

type PhotoState = {
  personPhoto: string | null;
  clothingPhoto: string | null;
};

export function usePhotoCapture() {
  const [photos, setPhotos] = useState<PhotoState>({
    personPhoto: null,
    clothingPhoto: null,
  });

  const setPersonPhoto = useCallback((uri: string) => {
    setPhotos(prev => ({...prev, personPhoto: uri}));
  }, []);

  const setClothingPhoto = useCallback((uri: string) => {
    setPhotos(prev => ({...prev, clothingPhoto: uri}));
  }, []);

  const reset = useCallback(() => {
    setPhotos({personPhoto: null, clothingPhoto: null});
  }, []);

  const isReady = photos.personPhoto !== null && photos.clothingPhoto !== null;

  return {
    ...photos,
    setPersonPhoto,
    setClothingPhoto,
    reset,
    isReady,
  };
}
