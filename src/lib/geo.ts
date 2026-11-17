import { DEPARTMENTS, DISTRICTS, MUNICIPALITIES } from "../../db/geo.mjs";

/**
 * División territorial de El Salvador (2024): departamento → municipio → distrito.
 * La gente busca por distrito («Santa Tecla»), así que ese es el nivel que se elige;
 * el municipio nuevo («La Libertad Sur») se deriva y se muestra como contexto.
 */
export type Department = { id: string; name: string; lat: number; lng: number; slug: string };
export type Municipality = { id: number; departmentId: string; name: string };
export type District = {
  id: number;
  municipalityId: number;
  departmentId: string;
  name: string;
  lat: number;
  lng: number;
  slug: string;
};

export function slug(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const departments: Department[] = DEPARTMENTS.map(([id, name, lat, lng]) => ({
  id,
  name,
  lat,
  lng,
  slug: slug(name),
})).sort((a, b) => a.name.localeCompare(b.name, "es"));

export const municipalities: Municipality[] = MUNICIPALITIES.map(([id, departmentId, name]) => ({
  id,
  departmentId,
  name,
}));

const municipalityById = new Map(municipalities.map((m) => [m.id, m]));
const departmentById = new Map(departments.map((d) => [d.id, d]));

export const districts: District[] = DISTRICTS.map(([id, municipalityId, name, lat, lng]) => {
  const departmentId = municipalityById.get(municipalityId)!.departmentId;
  // Hay nombres repetidos entre departamentos (San Rafael, El Carmen…): el slug lleva ambos.
  return {
    id,
    municipalityId,
    departmentId,
    name,
    lat,
    lng,
    slug: `${slug(name)}-${departmentById.get(departmentId)!.slug}`,
  };
}).sort((a, b) => a.name.localeCompare(b.name, "es"));

const districtById = new Map(districts.map((d) => [d.id, d]));

export const getDepartment = (id: string) => departmentById.get(id);
export const getDistrict = (id: number) => districtById.get(id);
export const getMunicipality = (id: number) => municipalityById.get(id);
export const districtsOf = (departmentId: string) =>
  districts.filter((d) => d.departmentId === departmentId);
export const departmentBySlug = (s: string) => departments.find((d) => d.slug === s);
export const districtBySlug = (s: string) => districts.find((d) => d.slug === s);

/** Centro y encuadre del país. */
export const COUNTRY = { lat: 13.75, lng: -88.9, zoom: 9 };

/**
 * Filtro de zona que viaja en la URL y en el estado: "" (todo el país),
 * "dep:05" (un departamento) o "dis:3585968" (un distrito).
 */
export function parseZone(zone: string) {
  if (zone.startsWith("dep:")) {
    const department = getDepartment(zone.slice(4));
    return department ? { department, district: undefined } : null;
  }
  if (zone.startsWith("dis:")) {
    const district = getDistrict(Number(zone.slice(4)));
    return district ? { department: getDepartment(district.departmentId)!, district } : null;
  }
  return null;
}

export function zoneLabel(zone: string) {
  const z = parseZone(zone);
  if (!z) return "";
  return z.district ? `${z.district.name}, ${z.department.name}` : z.department.name;
}
