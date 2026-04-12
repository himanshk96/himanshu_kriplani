import {useState, useEffect, useCallback} from 'react';
import ModelService from '../services/ModelService';

type ModelStatus = {
  gemmaDownloaded: boolean;
  segmentationDownloaded: boolean;
  allReady: boolean;
  loading: boolean;
};

export function useModelStatus() {
  const [status, setStatus] = useState<ModelStatus>({
    gemmaDownloaded: false,
    segmentationDownloaded: false,
    allReady: false,
    loading: true,
  });

  const refresh = useCallback(async () => {
    setStatus(prev => ({...prev, loading: true}));
    const [gemma, seg] = await Promise.all([
      ModelService.isModelDownloaded(),
      ModelService.isSegmentationModelDownloaded(),
    ]);
    setStatus({
      gemmaDownloaded: gemma,
      segmentationDownloaded: seg,
      allReady: gemma && seg,
      loading: false,
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {...status, refresh};
}
