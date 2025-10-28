import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import {
  Box, Button, FormHelperText, FormControl, InputLabel, OutlinedInput,
  InputAdornment, IconButton, TextField, Typography
} from '@mui/material';
import * as Yup from 'yup';
import { Formik } from 'formik';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import axiosInstance from 'api/axiosInstance';

const AuthLogin = ({ hideGoogle = false }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = React.useState(false);

  const handleClickShowPassword = () => setShowPassword(!showPassword);
  const handleMouseDownPassword = (event) => event.preventDefault();

  const handleLogin = async (values, { setSubmitting, setErrors }) => {
    try {
      const response = await axiosInstance.post('/login', {
        email: values.email,
        password: values.password
      });

      const { user, token } = response.data.data;

      localStorage.setItem('auth_user', JSON.stringify(user));
      localStorage.setItem('auth_token', token);
      localStorage.setItem('isAuthenticated', 'true');
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      navigate('/');
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        setErrors({ submit: 'Email atau password salah!' });
      } else {
        setErrors({ submit: 'Terjadi kesalahan, coba lagi.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* === Tombol Google Login (Hanya tampil kalau hideGoogle = false) === */}
      {!hideGoogle && (
        <Button
          fullWidth
          sx={{
            fontSize: { md: '1rem', xs: '0.875rem' },
            fontWeight: 500,
            backgroundColor: theme.palette.grey[50],
            color: theme.palette.grey[600],
            textTransform: 'capitalize',
            '&:hover': { backgroundColor: theme.palette.grey[100] },
            mb: 2
          }}
          size="large"
          variant="contained"
        >
          Login with Google
        </Button>
      )}

      <Formik
        initialValues={{ email: '', password: '', submit: null }}
        validationSchema={Yup.object().shape({
          email: Yup.string().email('Email tidak valid').required('Email wajib diisi'),
          password: Yup.string().required('Password wajib diisi')
        })}
        onSubmit={handleLogin}
      >
        {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
          <form noValidate onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              onBlur={handleBlur}
              onChange={handleChange}
              value={values.email}
              margin="normal"
              variant="outlined"
              error={Boolean(touched.email && errors.email)}
              helperText={touched.email && errors.email}
            />

            <FormControl fullWidth error={Boolean(touched.password && errors.password)} sx={{ mt: 3, mb: 1 }}>
              <InputLabel htmlFor="outlined-adornment-password">Password</InputLabel>
              <OutlinedInput
                id="outlined-adornment-password"
                type={showPassword ? 'text' : 'password'}
                value={values.password}
                name="password"
                onBlur={handleBlur}
                onChange={handleChange}
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

            {errors.submit && (
              <Box mt={2}>
                <FormHelperText error>{errors.submit}</FormHelperText>
              </Box>
            )}

            <Box mt={2}>
              <Button
                fullWidth
                size="large"
                variant="contained"
                color="primary"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? 'Memproses...' : 'Login'}
              </Button>
            </Box>
          </form>
        )}
      </Formik>
    </>
  );
};

export default AuthLogin;
