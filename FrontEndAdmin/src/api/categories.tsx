import Client from '../../client/index';

export async function getItemCategory() {
  const response = await Client.get('/get-categories');

  return response.data;
}

export async function addCategory(values: addCategoriesRequest) {
  const data = await Client.post('/create-category', values, {
    headers: {
      Authorization: `jwt ${values.token}`,
    },
  });
  return data.data;
}

export async function editCategory(values: editCategoryRequest) {
  try {
    const data = await Client.post(
      '/edit-category',
      {
        name: values.name,
      },
      {
        headers: {
          Authorization: `jwt ${values.token}`,
          id: values.id,
        },
      },
    );
    return data.data;
  } catch (error) {
    console.error('Error editing category:', error);
    throw error;
  }
}
