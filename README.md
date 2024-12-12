### Flight Delay Analysis Research Project

---

#### **Overview**
This project analyzes factors influencing flight delays using data from three major New York airports (JFK, LGA, and EWR) for flights to other states in the U.S. The focus is on understanding the impact of weather conditions, seasonal differences, and flight destinations. Additionally, the project investigates correlations between flight delay-related variables to identify significant contributors to delays.

---


#### **Instructions for Reproducing Analysis**
1. **Data Loading**:
   - Put `flight_NYC_2023_08.csv`, `flight_NYC_2023_12.csv`, and `weather_NYC_2023.csv` in the working directory.
   - Make sure the correct date formats and variable encodings in the datasets.

2. **Script Execution**:
   - Run the provided R script sections in sequence to preprocess data, perform analysis, and generate visualizations.

3. **Libraries**:
   - Ensure required R packages are installed (`ggplot2`, `dplyr`, `ggridges`, `GGally`, `ggmosaic`).

---

#### **Project Outputs**
1. **Visualizations**:
   - Weather frequency and delay distributions.
   - Seasonal delay patterns using QQ-plots, line charts, and ridgeline plots.
   - Destination-specific delays with Cleveland dot plots.
   - Scatterplot matrix and detailed scatterplots of delays.
   
2. **Insights**:
   - August has greater delays due to higher demand.
   - Cloudy and rainy weather exacerbate delays.
   - Departure delays are the dominant factor influencing arrival delays.

---

#### **Conclusions**
- Addressing departure delays can significantly reduce overall flight delays.
- Seasonal planning and better preparation for adverse weather conditions can improve delay management.
- August (summer) is a high-risk month for delays compared to December (winter).

