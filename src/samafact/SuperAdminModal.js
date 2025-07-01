import React from 'react';
// eslint-disable-next-line no-unused-vars
import { Modal, Form, Input, Button, message } from 'antd';

const SuperAdminModal = ({ visible, onCancel, onCreate, loading }) => {
  const [form] = Form.useForm();

  return (
    <Modal
      open={visible}
      title="Créer un Super Administrateur"
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Annuler
        </Button>,
        <Button
          key="create"
          type="primary"
          loading={loading}
          onClick={() => {
            form
              .validateFields()
              .then(values => {
                onCreate(values);
              })
              .catch(info => {
                console.log('Validate Failed:', info);
              });
          }}
        >
          Créer
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="nom"
          label="Nom"
          rules={[{ required: true, message: 'Ce champ est requis' }]}
        >
          <Input placeholder="Nom" />
        </Form.Item>

        <Form.Item
          name="prenom"
          label="Prénom"
          rules={[{ required: true, message: 'Ce champ est requis' }]}
        >
          <Input placeholder="Prénom" />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Ce champ est requis' },
            { type: 'email', message: 'Email non valide' }
          ]}
        >
          <Input placeholder="email@domain.com" />
        </Form.Item>

        <Form.Item
          name="password"
          label="Mot de passe"
          rules={[
            { required: true, message: 'Ce champ est requis' },
            { min: 12, message: 'Minimum 12 caractères' }
          ]}
          hasFeedback
        >
          <Input.Password />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="Confirmation"
          dependencies={['password']}
          hasFeedback
          rules={[
            { required: true, message: 'Ce champ est requis' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject('Les mots de passe ne correspondent pas');
              },
            }),
          ]}
        >
          <Input.Password />
        </Form.Item>
      </Form>

    </Modal>
  );
};

export default SuperAdminModal;