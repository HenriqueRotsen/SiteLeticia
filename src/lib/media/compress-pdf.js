import { spawn } from "child_process";
import { PDFDocument } from "pdf-lib";

function compressPdfWithGhostscript(buffer) {
  return new Promise((resolve) => {
    const gsBin = process.env.GHOSTSCRIPT_BIN || "gs";
    const child = spawn(
      gsBin,
      [
        "-sDEVICE=pdfwrite",
        "-dCompatibilityLevel=1.4",
        "-dPDFSETTINGS=/ebook",
        "-dNOPAUSE",
        "-dQUIET",
        "-dBATCH",
        "-sOutputFile=-",
        "-"
      ],
      { stdio: ["pipe", "pipe", "ignore"] }
    );

    const chunks = [];

    child.stdout.on("data", (chunk) => chunks.push(chunk));
    child.on("error", () => resolve(null));
    child.on("close", (code) => {
      if (code !== 0) {
        resolve(null);
        return;
      }

      const output = Buffer.concat(chunks);
      resolve(output.length > 0 ? output : null);
    });

    child.stdin.write(buffer);
    child.stdin.end();
  });
}

export async function compressPdfBuffer(inputBuffer) {
  const original = Buffer.from(inputBuffer);
  let best = original;

  try {
    const document = await PDFDocument.load(original, { ignoreEncryption: true });
    const optimized = Buffer.from(await document.save({ useObjectStreams: true }));
    if (optimized.length < best.length) {
      best = optimized;
    }
  } catch {
    // Mantém o original se não for possível reprocessar com pdf-lib.
  }

  const ghostscriptOutput = await compressPdfWithGhostscript(best);
  if (ghostscriptOutput && ghostscriptOutput.length < best.length) {
    best = ghostscriptOutput;
  }

  return {
    buffer: best,
    originalBytes: original.length,
    compressedBytes: best.length
  };
}
