import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Button,
  FormHelperText,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
  IconButton
} from '@mui/material';
import * as Yup from 'yup';
import { Formik } from 'formik';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import axiosInstance from 'api/axiosInstance'; // pastikan path axiosInstance benar

const AuthRegister = ({ ...rest }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const handleClickShowPassword = () => setShowPassword(!showPassword);
  const handleClickShowConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);
  const handleMouseDownPassword = (event) => event.preventDefault();

  return (
    <Formik
      initialValues={{
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        submit: null
      }}
      validationSchema={Yup.object().shape({
        name: Yup.string().max(255).required('Name is required'),
        email: Yup.string().email('Must be a valid email').max(255).required('Email is required'),
        password: Yup.string().min(6, 'Password must be at least 6 characters').max(255).required('Password is required'),
        password_confirmation: Yup.string()
          .oneOf([Yup.ref('password'), null], 'Passwords must match')
          .required('Password confirmation is required')
      })}
      onSubmit={async (values, { setErrors, setSubmitting }) => {
        try {
          // Set role default "petugas"
          const payload = { ...values, role: 'petugas' };
          const response = await axiosInstance.post('/register', payload);
          if (response.data.success) {
            alert('Register berhasil, silakan login!');
            navigate('/login');
          } else {
            setErrors({ submit: response.data.message || 'Register gagal' });
          }
        } catch (error) {
          console.error(error);
          setErrors({ submit: error.response?.data?.message || error.message || 'Terjadi kesalahan' });
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
        <form noValidate onSubmit={handleSubmit} {...rest}>
          <TextField
            error={Boolean(touched.name && errors.name)}
            fullWidth
            helperText={touched.name && errors.name}
            label="Name"
            margin="normal"
            name="name"
            onBlur={handleBlur}
            onChange={handleChange}
            value={values.name}
            variant="outlined"
          />

          <TextField
            error={Boolean(touched.email && errors.email)}
            fullWidth
            helperText={touched.email && errors.email}
            label="Email"
            margin="normal"
            name="email"
            onBlur={handleBlur}
            onChange={handleChange}
            type="email"
            value={values.email}
            variant="outlined"
          />

          <FormControl
            fullWidth
            error={Boolean(touched.password && errors.password)}
            sx={{ mt: theme.spacing(3), mb: theme.spacing(1) }}
            variant="outlined"
          >
            <InputLabel htmlFor="outlined-adornment-password">Password</InputLabel>
            <OutlinedInput
              id="outlined-adornment-password"
              type={showPassword ? 'text' : 'password'}
              value={values.password}
              name="password"
              onBlur={handleBlur}
              onChange={handleChange}
              label="Password"
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleClickShowPassword}
                    onMouseDown={handleMouseDownPassword}
                    edge="end"
                    size="large"
                  >
                    {showPassword ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                </InputAdornment>
              }
            />
            {touched.password && errors.password && <FormHelperText error>{errors.password}</FormHelperText>}
          </FormControl>

          <FormControl
            fullWidth
            error={Boolean(touched.password_confirmation && errors.password_confirmation)}
            sx={{ mt: theme.spacing(1), mb: theme.spacing(1) }}
            variant="outlined"
          >
            <InputLabel htmlFor="outlined-adornment-password-confirmation">Confirm Password</InputLabel>
            <OutlinedInput
              id="outlined-adornment-password-confirmation"
              type={showConfirmPassword ? 'text' : 'password'}
              value={values.password_confirmation}
              name="password_confirmation"
              onBlur={handleBlur}
              onChange={handleChange}
              label="Confirm Password"
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleClickShowConfirmPassword}
                    onMouseDown={handleMouseDownPassword}
                    edge="end"
                    size="large"
                  >
                    {showConfirmPassword ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                </InputAdornment>
              }
            />
            {touched.password_confirmation && errors.password_confirmation && (
              <FormHelperText error>{errors.password_confirmation}</FormHelperText>
            )}
          </FormControl>

          {errors.submit && (
            <Box mt={3}>
              <FormHelperText error>{errors.submit}</FormHelperText>
            </Box>
          )}

          <Box mt={2}>
            <Button color="primary" disabled={isSubmitting} fullWidth size="large" type="submit" variant="contained">
              {isSubmitting ? 'Registering...' : 'Register'}
            </Button>
          </Box>
        </form>
      )}
    </Formik>
  );
};

export default AuthRegister;
