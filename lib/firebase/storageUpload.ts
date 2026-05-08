import {
  uploadBytesResumable,
  type StorageReference,
  type UploadMetadata,
} from "firebase/storage";

/** Upload with optional 0–1 progress (per file). */
export async function runResumableUpload(
  storageRef: StorageReference,
  data: Blob | Uint8Array | ArrayBuffer | File,
  metadata: UploadMetadata | undefined,
  onProgress?: (ratio01: number) => void,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, data, metadata);
    task.on(
      "state_changed",
      (snapshot) => {
        if (onProgress && snapshot.totalBytes > 0) {
          onProgress(snapshot.bytesTransferred / snapshot.totalBytes);
        }
      },
      reject,
      () => resolve(),
    );
  });
}
