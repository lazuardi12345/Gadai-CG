import PropTypes from 'prop-types';
import React from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Box, Card, CardContent, Grid, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';

// third party
import Chart from 'react-apexcharts';

// ==============================|| SUPPORT REQUEST CARD ||============================== //

const SupportRequestCard = ({ primary, secondary, color, chartData, footerData }) => {
  const theme = useTheme();

  // Ambil role user dari localStorage
  const user = JSON.parse(localStorage.getItem('auth_user'));
  const userRole = user?.role?.toLowerCase() || '';

  // Render hanya untuk HM dan Checker
  if (!['hm', 'checker'].includes(userRole)) return null;

  return (
    <Card>
      <CardContent sx={{ pb: 0 }}>
        <Typography variant="h2" sx={{ color: color }}>
          {primary}
        </Typography>
        <Typography component="span" variant="subtitle1">
          {secondary}
        </Typography>
      </CardContent>

      {chartData && chartData.options && chartData.series && chartData.type && (
        <Chart
          options={chartData.options}
          series={chartData.series}
          type={chartData.type}
          height={chartData.height || 200}
        />
      )}

      {footerData && footerData.length > 0 && (
        <Box sx={{ background: color }}>
          <Grid
            container
            justifyContent="space-around"
            sx={{ textAlign: 'center', p: theme.spacing(2), color: theme.palette.common.white }}
          >
            {footerData.map((item, index) => (
              <Grid item key={`${item.value}-${index}`}>
                <Typography variant="h3" color="inherit">
                  {item.value}
                </Typography>
                <Typography variant="body2" sx={{ color: grey[400] }}>
                  {item.title}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Card>
  );
};

SupportRequestCard.propTypes = {
  primary: PropTypes.string,
  secondary: PropTypes.string,
  color: PropTypes.string,
  chartData: PropTypes.shape({
    options: PropTypes.object.isRequired,
    series: PropTypes.array.isRequired,
    type: PropTypes.string.isRequired,
    height: PropTypes.number
  }),
  footerData: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string.isRequired
    })
  )
};

SupportRequestCard.defaultProps = {
  primary: '',
  secondary: '',
  color: '#1976d2',
  chartData: null,
  footerData: []
};

export default SupportRequestCard;
