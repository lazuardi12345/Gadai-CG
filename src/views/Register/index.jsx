import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Card, CardContent, Typography, Grid, Box } from '@mui/material';

// project import
import AuthRegister from './AuthRegister';

// assets
import Logo from 'assets/images/CGadai.png';

// ==============================|| REGISTER ||============================== //

const Register = () => {
  const theme = useTheme();

  return (
    <Grid
      container
      justifyContent="center"
      alignItems="center"
      sx={{ backgroundColor: theme.palette.common.black, height: '100%', minHeight: '100vh' }}
    >
      <Grid item xs={11} md={6} lg={4}>
        <Card
          sx={{
            overflow: 'visible',
            display: 'flex',
            position: 'relative',
            my: 3,
            mx: 'auto',
            '& .MuiCardContent-root': {
              flexGrow: 1,
              flexBasis: '50%',
              width: '50%'
            },
            maxWidth: 475
          }}
        >
          <CardContent sx={{ p: theme.spacing(5, 4, 3, 4) }}>
            <Grid container direction="column" spacing={4} justifyContent="center" alignItems="center">
              {/* Logo dan Judul */}
              <Grid item xs={12} sx={{ textAlign: 'center' }}>
                <Box
                  component="img"
                  src={Logo}
                  alt="Logo CG"
                  sx={{
                    height: 60, // tinggi ideal
                    width: 'auto',
                    objectFit: 'contain',
                    mb: 2
                  }}
                />
                <Typography color="textPrimary" gutterBottom variant="h2">
                  Register
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  To keep connected with us.
                </Typography>
              </Grid>

              {/* Form Register */}
              <Grid item xs={12}>
                <AuthRegister hideGoogle={true} />
              </Grid>

              {/* Link ke Login */}
              <Grid container justifyContent="flex-start" sx={{ mt: theme.spacing(2), mb: theme.spacing(1) }}>
                <Grid item>
                  <Typography
                    variant="subtitle2"
                    color="secondary"
                    component={RouterLink}
                    to="/login"
                    sx={{ textDecoration: 'none', pl: 2 }}
                  >
                    Having an account
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default Register;
