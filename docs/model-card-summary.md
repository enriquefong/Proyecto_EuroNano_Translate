# TranslatePsy-EuroNano — Model Card Summary

Este documento resume las capacidades del modelo NMT (Neural Machine Translation) base del proyecto, extraídas del documento de diseño.

## Identificación
- **Nombre**: `qvac/TranslatePsy-EuroNano`
- **Arquitectura**: Marian / Bergamot
  - Encoder: 6 capas Transformer
  - Decoder: SSRU (Simpler Simple Recurrent Unit)
- **Vocabulario**: SentencePiece BPE de 32,000 subtokens (compartido en todos los idiomas).
- **Entorno de ejecución**: CPU, empleando el motor intgemm para matemática de enteros 8-bit.

## Idiomas Soportados (10 en total)
- **Central**: Inglés (EN)
- **Nodos**: Alemán (DE), Español (ES), Francés (FR), Italiano (IT), Portugués (PT), Finlandés (FI), Checo (CS), Holandés (NL), Sueco (SV).

## Topología de Traducción (Hub-and-Spoke)
El modelo entrena traducciones directas solo desde y hacia el inglés.

- **en → xx (Inglés a otro idioma)**
  - Requiere un **Target Tag** al inicio de la frase en inglés para indicar el idioma de salida (ej. `##DE Hello` → `Hallo`).
- **xx → en (Otro idioma a Inglés)**
  - Traducción directa sin necesidad de etiquetas. El encoder detecta el idioma origen automáticamente.
- **xx → yy (Cualquier par sin inglés)**
  - Se utiliza una **Estrategia de Pivote**: `xx → en` seguido de `en → yy`.
  - Ejemplo ES → FR: El texto en español se traduce primero al inglés. Al texto en inglés se le añade la etiqueta `##FR` y se pasa de nuevo por el modelo para obtener el francés.

## Variantes Disponibles

El proyecto integra tres puntos de control (checkpoints) distintos para equilibrar velocidad, memoria y calidad.

| Variante | Parámetros | Tamaño Memoria (INT8) | Uso Recomendado |
| :--- | :--- | :--- | :--- |
| **Tiny** | 16.9M | 17 MB | Gama de entrada, o necesidad de max. velocidad |
| **BaseMemory** | 31.25M | 31 MB | Balance general (gama media) |
| **Base** | 42.68M | 42 MB | Mayor precisión, gama alta (Snapdragon serie 8) |

## Evaluación de Calidad (Métrica COMET)

Se obtienen valores que rivalizan con sistemas basados en la nube a pesar del tamaño ultra-reducido.

* **xx → en (Hacia inglés)**: Promedio de **0.860** (ej. ES→EN alcanza 0.878)
* **en → xx (Desde inglés)**: Promedio de **0.826** (ligeramente más complejo debido a la morfología objetivo).

*Nota: Firefox Translations obtiene típicamente ~0.87 en modelos de 150MB.*
