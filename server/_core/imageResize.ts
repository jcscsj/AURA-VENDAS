import sharp from "sharp";

/**
 * Redimensiona uma imagem para o tamanho padrão de produtos
 * Tamanho padrão: 1590px x 2158px
 */
export async function resizeProductImage(
  imageBuffer: Buffer,
  width: number = 1590,
  height: number = 2158,
): Promise<Buffer> {
  try {
    return await sharp(imageBuffer)
      .resize(width, height, {
        fit: "cover",
        position: "center",
      })
      .webp({ quality: 90 })
      .toBuffer();
  } catch (error) {
    console.error("[ImageResize] Erro ao redimensionar imagem:", error);
    throw new Error("Falha ao processar imagem");
  }
}

/**
 * Redimensiona uma imagem para o tamanho padrão de banners
 * Tamanho padrão: 1920px x 1080px
 */
export async function resizeBannerImage(
  imageBuffer: Buffer,
  width: number = 1920,
  height: number = 1080,
): Promise<Buffer> {
  try {
    return await sharp(imageBuffer)
      .resize(width, height, {
        fit: "cover",
        position: "center",
      })
      .webp({ quality: 90 })
      .toBuffer();
  } catch (error) {
    console.error("[ImageResize] Erro ao redimensionar imagem:", error);
    throw new Error("Falha ao processar imagem");
  }
}

/**
 * Valida se a imagem é um formato suportado
 */
export async function validateImageFormat(imageBuffer: Buffer): Promise<boolean> {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    const supportedFormats = ["jpeg", "png", "webp", "gif"];
    return metadata.format ? supportedFormats.includes(metadata.format) : false;
  } catch {
    return false;
  }
}
