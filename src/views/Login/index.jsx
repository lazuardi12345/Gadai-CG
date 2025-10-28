import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Card, CardContent, Typography, Grid, Box, Button, Stack } from '@mui/material';

// project import
import AuthLogin from './AuthLogin';

// assets
import Logo from 'assets/images/CGadai.png';

// ==============================|| LOGIN (Tanpa Google Login, Logo Tengah) ||============================== //

const Login = () => {
  const theme = useTheme();

  return (
    <Grid
      container
      justifyContent="center"
      alignItems="center"
      sx={{
        backgroundColor: theme.palette.common.black,
        height: '100%',
        minHeight: '100vh'
      }}
    >
      <Grid item xs={11} sm={7} md={6} lg={4}>
        <Card
          sx={{
            overflow: 'visible',
            position: 'relative',
            maxWidth: '475px',
            margin: '24px auto',
            textAlign: 'center',
            py: 3
          }}
        >
          <CardContent sx={{ p: theme.spacing(5, 4, 3, 4) }}>
            {/* LOGO DI TENGAH */}
            <Box
              component="img"
              src={Logo}
              alt="Logo CG"
              sx={{
                height: 70,
                width: 'auto',
                objectFit: 'contain',
                display: 'block',
                mx: 'auto',
                mb: 2
              }}
            />

            {/* JUDUL LOGIN */}
            <Typography color="textPrimary" gutterBottom variant="h4" sx={{ fontWeight: 600 }}>
              Sign In
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Please enter your email and password to continue.
            </Typography>

            {/* FORM LOGIN */}
            <AuthLogin hideGoogle={true} /> {/* Hide Google button di dalam komponen form */}

            {/* REGISTER LINK */}
            <Stack direction="row" justifyContent="center" sx={{ mt: 3 }}>
              <Typography
                variant="subtitle2"
                color="secondary"
                component={RouterLink}
                to="/register"
                sx={{ textDecoration: 'none' }}
              >
                Create new account
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default Login;
