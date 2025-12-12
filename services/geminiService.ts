import { GoogleGenAI } from "@google/genai";
import { DatasetStats, ProcessedCompany } from "../types";

export const generateAIAnalysis = async (
  stats: DatasetStats,
  topCompanies: ProcessedCompany[]
): Promise<string> => {
  const apiKey = process.env.API_KEY;

  // MODO OFFLINE / SIN API KEY
  // Si no hay clave, devolvemos un mensaje informativo sin intentar conectar.
  if (!apiKey) {
    return `### 📡 Módulo de Inteligencia Artificial Desactivado
    
Estás utilizando la versión **Offline** del Dashboard. 

**¿Qué significa esto?**
*   ✅ **Todos los cálculos son correctos:** El scoring, la segmentación y los gráficos se han generado localmente en tu navegador con precisión matemática.
*   ✅ **Tus datos están seguros:** Al no haber conexión con IA externa, ningún dato ha salido de tu ordenador.
*   ❌ **Sin Resumen Narrativo:** La generación automática de texto (análisis de tendencias redactado) requiere conexión con Google Gemini y una API Key activa.

Puedes imprimir el reporte en PDF desde la pestaña "Explorador" para obtener los datos estructurados.`;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Prepare a summarized context
    const top5Summary = topCompanies.slice(0, 5).map(c => 
      `- ${c.normalizedName} (Sector: ${c.segmentation.primarySector}, Prov: ${c.segmentation.province}): Score ${c.score.total}. Sales: ${c["Ventas 2024"] || 'N/A'}`
    ).join('\n');

    const topSectorsStr = JSON.stringify(Object.entries(stats.topSectors).sort((a,b) => b[1]-a[1]).slice(0, 5));
    const topProvincesStr = JSON.stringify(Object.entries(stats.topProvinces).sort((a,b) => b[1]-a[1]).slice(0, 5));

    const prompt = `
      You are an expert Market Intelligence Analyst. 
      You are provided with a summary of a dataset extracted from an "Alimarket" Excel file. 
      
      **Dataset Overview:**
      - Total Companies: ${stats.totalCompanies}
      - Top Sectors/Activities: ${topSectorsStr}
      - Top Regions/Provinces: ${topProvincesStr}
      - Size Distribution: ${JSON.stringify(stats.sizeDistribution)}
      
      **Top 5 Market Leaders (Shortlist):**
      ${top5Summary}

      **Objective:**
      1. **Identify the Industry:** Based on the sector names and companies, explicitly state what industry this dataset represents.
      2. **Strategic Analysis:** Provide a market analysis covering concentration (by region/sector), market leaders, and data maturity.
      3. **Actionable Insights:** Identify trends based on the top sectors and size distribution.

      Return the response in **Spanish**, formatted in **Markdown**. Keep it professional and executive.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "No se pudo generar el análisis.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return `### ⚠️ Error de Conexión
    
Hubo un problema al intentar conectar con el servicio de IA.
    
1. Verifica tu conexión a internet.
2. Si has configurado una API Key, verifica que tenga cuota disponible.
    
*El resto del Dashboard sigue funcionando con normalidad.*`;
  }
};