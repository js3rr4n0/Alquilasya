/**
 * ¿Hay un almacén de fotos conectado? Vercel Blob funciona con un token
 * (BLOB_READ_WRITE_TOKEN) o, en almacenes creados recientemente, con el id del
 * almacén (BLOB_STORE_ID) y la identidad del proyecto que Vercel inyecta sola.
 */
export const blobConfigured = () =>
  Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
