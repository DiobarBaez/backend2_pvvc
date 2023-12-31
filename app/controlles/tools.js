const { httpError } = require('../helpers/handleError');
const toolModel = require('../models/tools');
const { Binary } = require('mongodb');


/**********  FUNCIONES PRINCIPALES   **********/
const getTools = async (req, res) => {
    try {
        const listAll = await toolModel.find({});

        // Convert image data to Base64
        const toolsWithBase64Images = listAll.map((tool) => {
            if (tool.items) {
                tool.items = tool.items.map((item) => {
                    if (item.imageUrl && item.imageUrl.data) {
                        // Convert Buffer to Base64
                        const base64Image = item.imageUrl.data.toString('base64');
                        // Update item.imageUrl.data to store the Base64-encoded data
                        item.imageUrl.data = base64Image;
                        // Remove the original Buffer field if you don't need it anymore
                        delete item.imageUrl.contentType;
                    }
                    return item;
                });
            }
            return tool;
        });

        res.status(200).json({ data: toolsWithBase64Images });
    } catch (error) {
        httpError(res, error);
    }
};



const createTool = async (req, res) => {
  try {
    const { nombre, acronimo, categoria, items } = req.body;

    console.log(req.body)
    // Verificar si ya existe una herramienta con el mismo nombre o acrónimo
    const toolExistente = await toolModel.findOne({
      $or: [
        { nombre: nombre },
        { acronimo: acronimo }
      ]
    });

    if (toolExistente) {
      return res.status(409).json({ message: 'Ya existe una herramienta con el mismo nombre o acrónimo.' });
    } else {
      // Si no existe, crea una nueva herramienta
      const nuevaTool = await toolModel.create({ nombre, acronimo, categoria, items });

      // Modifica cada item para manejar la propiedad imageUrl
      nuevaTool.items = items.map(item => {
        return {
          ...item,
          imageUrl: {
            data: item.imageUrl.data.split(',')[1], // Obtén solo el contenido base64
            contentType: item.imageUrl.typeFile,
          }
        };
      });

      console.log(nuevaTool.items.data)

      const toolGuardada = await nuevaTool.save();
      res.status(201).json({ data: toolGuardada, message: 'Herramienta creada con éxito.' });
    }
  } catch (error) {
    httpError(res, error);
  }
};


/********** CRUD POR PROPIEDAD DE ID **********/

const getToolById = async (req, res) => {
    try {
        const itemId = req.params.id;
        const item = await toolModel.findById(itemId);
        if (item) {
            res.status(200).json({ data: item });
        } else {
            res.status(404).json({ message: 'Herramienta no encontrada.' });
        }
    } catch (error) {
        httpError(res, error);
    }
}

const updateToolById = async (req, res) => {
    try {
        const itemId = req.params.id;
        const { nombre, acronimo, categoria, items } = req.body;
        const updatedItem = await toolModel.findByIdAndUpdate(itemId, {
            nombre, acronimo, categoria, items
        }, { new: true });
        if (updatedItem) {
            res.status(200).json({ data: updatedItem, message: 'Herramienta actualizada con éxito.' });
        } else {
            res.status(404).json({ message: 'Herramienta no encontrada.' });
        }
    } catch (error) {
        httpError(res, error);
    }
}

const deleteToolById = async (req, res) => {
    try {
        const itemId = req.params.id;
        const deletedItem = await toolModel.findByIdAndRemove(itemId);
        if (deletedItem) {
            res.status(204).json({ message: 'Herramienta eliminada con éxito.', data: deletedItem });
        } else {
            res.status(404).json({ message: 'Herramienta no encontrada.' });
        }
    } catch (error) {
        httpError(res, error);
    }
}

/********** CRUD POR PROPIEDAD DE NOMBRE **********/

const getToolByName = async (req, res) => {
    try {
        const itemName = req.params.nombre;
        const item = await toolModel.findOne({ nombre: itemName });
        if (item) {
            res.status(200).json({ data: item });
        } else {
            res.status(404).json({ message: 'Herramienta no encontrada.' });
        }
    } catch (error) {
        httpError(res, error);
    }
}

const updateToolByName = async (req, res) => {
    try {
        const itemName = req.params.nombre;
        const { nombre, acronimo, categoria, items } = req.body;
        const updatedItem = await toolModel.findOneAndUpdate(
            { nombre: itemName },
            { nombre, acronimo, categoria, items },
            { new: true }
        );
        if (updatedItem) {
            res.status(200).json({   data: updatedItem, message: 'Herramienta actualizada con éxito.' });
        } else {
            res.status(404).json({ message: 'Herramienta no encontrada.' });
        }
    } catch (error) {
        httpError(res, error);
    }
}

const deleteToolByName = async (req, res) => {
    try {
        const itemName = req.params.nombre;
        const deletedItem = await toolModel.findOneAndRemove({ nombre: itemName });
        if (deletedItem) {
            res.status(204).json({ message: 'Herramienta eliminada con éxito.', data: deletedItem });
        } else {
            res.status(404).json({ message: 'Herramienta no encontrada.' });
        }
    } catch (error) {
        httpError(res, error);
    }
}

module.exports = { getTools, createTool, getToolById, updateToolById, deleteToolById, getToolByName, updateToolByName, deleteToolByName, };
