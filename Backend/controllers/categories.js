const mongoose = require('mongoose');
const User = require('../models/user');
const Category = require('../models/auctionCategories.js');
const jwt = require('jsonwebtoken');

exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }
    const category = new Category({ name });
    await category.save();
    res
      .status(201)
      .json({ message: 'Category created successfully', category });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const id = req.headers.id;
    if (!id) {
      return res.status(400).json({ message: 'Category id is required' });
    }
    await Category.findByIdAndDelete(id);

    res.status(201).json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.editCategory = async (req, res) => {
  try {
    const id = req.headers.id;
    if (!id) {
      return res.status(400).json({ message: 'Category id is required' });
    }
    const category = await Category.findById(id);
    if (!category) {
      return res.status(400).json({ message: 'Category not found' });
    }
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }
    const uodatedCategory = await Category.findByIdAndUpdate(
      id,
      {
        name,
      },
      { new: true },
    );
    res.status(201).json({
      message: 'Category updated successfully',
      category: uodatedCategory,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json({ categories });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
