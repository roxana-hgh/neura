import type { EditorView } from "@tiptap/pm/view";

const MAX_SIDE = 1600;

/** Downscale and re-encode so notes don't carry multi-megabyte photos */
async function fileToDataUrl(file: File): Promise<string> {
  if (file.type === "image/gif" || file.type === "image/svg+xml") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const webp = canvas.toDataURL("image/webp", 0.82);
  if (webp.startsWith("data:image/webp")) return webp;

  // No WebP encoder (older Safari): JPEG on a white background
  ctx.globalCompositeOperation = "destination-over";
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

export async function insertImageFile(view: EditorView, file: File) {
  if (!file.type.startsWith("image/")) return;
  const src = await fileToDataUrl(file);
  const node = view.state.schema.nodes.image.create({ src });
  view.dispatch(view.state.tr.replaceSelectionWith(node).scrollIntoView());
  view.focus();
}

export const firstImageFile = (files: FileList | null | undefined) =>
  Array.from(files ?? []).find((f) => f.type.startsWith("image/"));
