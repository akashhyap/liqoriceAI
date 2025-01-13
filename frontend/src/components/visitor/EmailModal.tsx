import React from 'react';
import {
  Dialog,
  Button,
  TextField,
  Box,
  Typography
} from '@mui/material';
import { useFormik } from 'formik';
import * as yup from 'yup';

const validationSchema = yup.object({
  email: yup
    .string()
    .email('Enter a valid email')
    .required('Email is required'),
});

interface EmailModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (email: string) => void;
}

const EmailModal: React.FC<EmailModalProps> = ({ open, onClose, onSubmit }) => {
  const formik = useFormik({
    initialValues: {
      email: '',
    },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      onSubmit(values.email);
    },
  });

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 2,
        }
      }}
    >
      <Box 
        component="form" 
        onSubmit={formik.handleSubmit}
        sx={{ p: 3 }}
      >
        <Typography variant="h5" align="center" gutterBottom>
          Welcome to Chat
        </Typography>
        <Typography color="text.secondary" align="center" gutterBottom>
          Please enter your email to continue
        </Typography>
        
        <TextField
          fullWidth
          id="email"
          name="email"
          label="Email"
          value={formik.values.email}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.email && Boolean(formik.errors.email)}
          helperText={formik.touched.email && formik.errors.email}
          margin="normal"
          autoFocus
        />
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            disabled={formik.isSubmitting}
          >
            Start Chat
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};

export default EmailModal;
