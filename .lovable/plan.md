# Fix Media Library Upload

## What is going wrong

The Upload button is designed to stay grey until a file has been chosen. The only way to choose a file is a plain, unstyled browser file field. In the Craft OS styling this field is easy to miss or looks like plain text, so the button looks broken.

Checked and working, so these stay as they are:
- You are set up as the owner (higantemarinelle@gmail.com).
- The storage folder accepts PNG, JPG, WEBP, GIF and AVIF files up to 15 MB.
- Your account has permission to save media records and files.

There are 0 uploaded assets so far, which fits the picture of nobody ever getting past choosing a file.

## The fix

1. **A clear drop zone for choosing a file.** Replace the plain file field with a large dashed box that says "Click to choose an image or drag it here". It also shows the allowed file types and the 15 MB limit. You can click it, drag a file onto it, or use the keyboard.
2. **Show what you picked.** After you choose a file, show a small preview, the file name and size, and a "Change file" link. The Name field fills itself in from the file name.
3. **Say why Upload is grey.** Under a grey button, show "Choose an image first". Instead of quietly ignoring a wrong file type or a file over 15 MB, show a clear error.
4. **Use it in both places.** The same chooser goes in the Media Library "Upload asset" window and in the "Upload" tab of the media picker used inside the Theme Builder and the product editor.
5. **Visible errors and success.** If saving fails, show the real reason in red inside the window. On success, show a "Uploaded" message, close the window and show the new image in the library right away.

## Technical details

- New shared `src/components/admin/craft-studio/AssetFileDropzone.tsx`: a hidden `<input type="file">` behind a styled `<label>`. It handles drag and drop, keyboard focus, an object-URL preview (cleaned up on unmount) and validates type and size with `ALLOWED_MIME_TYPES` / `MAX_FILE_SIZE_BYTES`.
- Use it in `craft-studio.assets.tsx` (UploadDialog) and `MediaPicker.tsx` (UploadPanel). Reset the selection when the dialog closes. Add sonner success toasts, and on success invalidate the `craft-assets` queries in both places.
- No changes to `adminReserveAssetUpload`, the storage rules, the bucket or the database. No migration.
- Add a small unit test for the type and size check: a 16 MB image or a PDF is rejected, and a 2 MB PNG is accepted.

## Verification

Use Playwright with a file attached through the hidden input. Check that the Upload button becomes clickable once a file is chosen, and that the preview and file name appear. If an owner session can be created, run a real upload and confirm the image appears in the library and in the Theme Builder media picker. If not, say plainly which steps you still need to test.
