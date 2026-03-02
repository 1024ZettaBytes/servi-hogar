import { connectToDatabase, isConnected } from '../db';
import { Tool } from '../models/Tool';

Tool.init();

// Default tools list for technicians
const DEFAULT_TOOLS = [
  'Pinzas de presión',
  'Pinzas de electricista',
  'Pinzas de punta',
  'Desarmador plano',
  'Desarmador de cruz',
  'Llave inglesa',
  'Llave Stillson',
  'Multímetro',
  'Cinta de aislar',
  'Cinta métrica',
  'Juego de llaves Allen',
  'Navaja multiusos',
  'Martillo',
  'Segueta',
  'Linterna'
];

export async function getToolsData() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const tools = await Tool.find({ isActive: true }).sort({ name: 1 }).lean();
  return tools;
}

export async function seedDefaultTools() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  const existingTools = await Tool.countDocuments();
  if (existingTools === 0) {
    const toolDocs = DEFAULT_TOOLS.map((name) => ({ name, isActive: true }));
    await Tool.insertMany(toolDocs);
  }
  return await Tool.find({ isActive: true }).sort({ name: 1 }).lean();
}

export async function addTool({ name }) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  let error = new Error();
  error.name = 'Internal';
  if (!name || name.trim().length === 0) {
    error.message = 'El nombre de la herramienta es requerido.';
    throw error;
  }
  const existing = await Tool.findOne({ name: name.trim() });
  if (existing) {
    error.message = 'Ya existe una herramienta con ese nombre.';
    throw error;
  }
  const newTool = new Tool({ name: name.trim() });
  await newTool.save();
  return newTool;
}
