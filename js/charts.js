/**
 * Custom Bauhaus Chart Renderer using SVG
 */

const BauhausCharts = {
  // Category colors mapping
  categoryColors: {
    Groceries: "#E23E28",           // Red
    "Security Deposit": "#1A568D",  // Blue
    Rent: "#FFC83B",                // Yellow
    Internet: "#121212",            // Black
    Other: "#9E9E9E"                // Grey
  },

  // Member colors cycle
  memberColors: [
    "#E23E28", // Red
    "#1A568D", // Blue
    "#FFC83B", // Yellow
    "#121212"  // Black
  ],

  /**
   * Renders the category donut chart inside container
   */
  renderCategoryChart(containerId, categoryData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Check if there is data
    const total = Object.values(categoryData).reduce((sum, val) => sum + val, 0);
    if (total === 0) {
      container.innerHTML = `
        <div class="empty-state">
          NO SPENDING LOGGED YET<br>
          <span style="font-size: 0.8rem; font-weight: normal;">Add expenses to see category breakdown.</span>
        </div>`;
      return;
    }

    const radius = 55;
    const strokeWidth = 28;
    const cx = 100;
    const cy = 100;
    const circumference = 2 * Math.PI * radius; // ~345.57

    let currentOffset = 0;
    let svgContent = `<svg class="chart-svg" viewBox="0 0 200 200" width="100%" height="100%">`;

    // Filter categories with values > 0
    const activeCategories = Object.entries(categoryData)
      .filter(([_, value]) => value > 0)
      .sort((a, b) => b[1] - a[1]);

    // Draw the segments
    activeCategories.forEach(([category, value]) => {
      const percentage = value / total;
      const dashArrayVal = percentage * circumference;
      const color = this.categoryColors[category] || this.categoryColors.Other;
      
      // Arc segment
      svgContent += `
        <circle cx="${cx}" cy="${cy}" r="${radius}" 
          fill="none" 
          stroke="${color}" 
          stroke-width="${strokeWidth}" 
          stroke-dasharray="${dashArrayVal} ${circumference}" 
          stroke-dashoffset="${-currentOffset}" 
          transform="rotate(-90 ${cx} ${cy})" />
      `;

      // Draw a line to separate segments (adds to Bauhaus geometric look)
      if (activeCategories.length > 1) {
        const angle = (currentOffset / circumference) * 360 - 90;
        const rad = (angle * Math.PI) / 180;
        // Inner and outer coordinates for separation line
        const rInner = radius - strokeWidth/2;
        const rOuter = radius + strokeWidth/2;
        const x1 = cx + rInner * Math.cos(rad);
        const y1 = cy + rInner * Math.sin(rad);
        const x2 = cx + rOuter * Math.cos(rad);
        const y2 = cy + rOuter * Math.sin(rad);
        
        svgContent += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#121212" stroke-width="2" />`;
      }

      currentOffset += dashArrayVal;
    });

    // Add Bauhaus Outlines (Inner & Outer boundaries for the donut)
    svgContent += `
      <!-- Outer boundary -->
      <circle cx="${cx}" cy="${cy}" r="${radius + strokeWidth/2}" fill="none" stroke="#121212" stroke-width="3" />
      <!-- Inner boundary -->
      <circle cx="${cx}" cy="${cy}" r="${radius - strokeWidth/2}" fill="none" stroke="#121212" stroke-width="3" />
      
      <!-- Central Geometric Bauhaus Text -->
      <text x="${cx}" y="${cy - 4}" text-anchor="middle" font-family="'Space Grotesk'" font-weight="700" font-size="12" fill="#121212">TOTAL</text>
      <text x="${cx}" y="${cy + 12}" text-anchor="middle" font-family="'Space Grotesk'" font-weight="700" font-size="14" fill="#121212">₹${total.toFixed(0)}</text>
    </svg>`;

    // Append legend HTML
    let legendHtml = `<div class="chart-legend">`;
    activeCategories.forEach(([category, value]) => {
      const pct = ((value / total) * 100).toFixed(0);
      const color = this.categoryColors[category] || this.categoryColors.Other;
      legendHtml += `
        <div class="legend-item">
          <span class="legend-color" style="background-color: ${color};"></span>
          <span>${category} (${pct}%)</span>
        </div>
      `;
    });
    legendHtml += `</div>`;

    container.innerHTML = `<div style="text-align: center; width: 100%; max-width: 240px; margin: 0 auto;">${svgContent}</div>${legendHtml}`;
  },

  /**
   * Renders the member spending horizontal bar chart inside container
   */
  renderMemberChart(containerId, memberData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const entries = Object.entries(memberData);
    const maxSpent = Math.max(...Object.values(memberData), 0);
    const total = entries.reduce((sum, e) => sum + e[1], 0);

    if (total === 0) {
      container.innerHTML = `
        <div class="empty-state">
          NO SPENDING LOGGED YET<br>
          <span style="font-size: 0.8rem; font-weight: normal;">Add expenses to see member breakdowns.</span>
        </div>`;
      return;
    }

    let htmlContent = `<div style="display: flex; flex-direction: column; gap: 16px; width: 100%;">`;

    entries.forEach(([name, spent], index) => {
      const percentage = maxSpent > 0 ? (spent / maxSpent) * 100 : 0;
      const color = this.memberColors[index % this.memberColors.length];
      
      // Determine font color of text inside bar for accessibility (black/white contrast)
      // Yellow and White background get dark text, red and blue get white text.
      const textColor = (color === "#FFC83B" || color === "#FFFFFF") ? "var(--bh-black)" : "var(--bh-white)";

      htmlContent += `
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 0.85rem;">
            <span>${name.toUpperCase()}</span>
            <span>₹${spent.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <!-- Bar container with thick black border -->
          <div style="width: 100%; border: 3px solid #121212; height: 32px; background-color: var(--bg-sand); position: relative; box-shadow: 4px 4px 0px #121212;">
            <!-- Colored inner bar -->
            <div style="width: ${Math.max(percentage, 2)}%; height: 100%; background-color: ${color}; border-right: ${percentage > 0 ? '3px solid #121212' : 'none'}; display: flex; align-items: center; padding-left: 12px; transition: width 0.5s ease-out;">
              ${spent > 0 && percentage > 15 ? `<span style="font-size: 0.8rem; font-weight: 700; color: ${textColor};">${((spent / total) * 100).toFixed(0)}%</span>` : ''}
            </div>
            <!-- If percentage is small, render percentage text outside -->
            ${spent > 0 && percentage <= 15 ? `<span style="position: absolute; left: calc(${percentage}% + 10px); top: 50%; transform: translateY(-50%); font-size: 0.8rem; font-weight: 700; color: var(--bh-black);">${((spent / total) * 100).toFixed(0)}%</span>` : ''}
          </div>
        </div>
      `;
    });

    htmlContent += `</div>`;
    container.innerHTML = htmlContent;
  }
};
