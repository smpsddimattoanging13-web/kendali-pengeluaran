// Native Canvas Chart (no external library)
const Chart = {
    colors: ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'],

    clear(canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    },

    // Pie / Doughnut chart for categories
    drawPie(canvas, data) {
        this.clear(canvas);
        const ctx = canvas.getContext('2d');
        const { width, height } = canvas;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 40;

        if (!data || data.length === 0) {
            ctx.fillStyle = '#6b7280';
            ctx.font = '14px Segoe UI';
            ctx.textAlign = 'center';
            ctx.fillText('Belum ada data', centerX, centerY);
            return;
        }

        const total = data.reduce((sum, d) => sum + d.value, 0);
        let startAngle = -Math.PI / 2;

        data.forEach((item, i) => {
            const sliceAngle = (item.value / total) * 2 * Math.PI;
            const color = this.colors[i % this.colors.length];

            // Draw slice
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            startAngle += sliceAngle;
        });

        // Legend
        ctx.font = '12px Segoe UI';
        ctx.textAlign = 'left';
        let legendY = 20;
        data.forEach((item, i) => {
            const color = this.colors[i % this.colors.length];
            const percent = ((item.value / total) * 100).toFixed(1);
            ctx.fillStyle = color;
            ctx.fillRect(10, legendY - 10, 12, 12);
            ctx.fillStyle = '#1f2937';
            ctx.fillText(`${item.label}: ${percent}%`, 28, legendY);
            legendY += 18;
        });
    },

    // Bar chart for daily or trend
    drawBar(canvas, labels, datasets) {
        this.clear(canvas);
        const ctx = canvas.getContext('2d');
        const { width, height } = canvas;
        const padding = 40;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;

        if (!labels || labels.length === 0) {
            ctx.fillStyle = '#6b7280';
            ctx.font = '14px Segoe UI';
            ctx.textAlign = 'center';
            ctx.fillText('Belum ada data', width / 2, height / 2);
            return;
        }

        // Find max value
        let maxVal = 0;
        datasets.forEach(ds => {
            ds.data.forEach(v => { if (v > maxVal) maxVal = v; });
        });
        if (maxVal === 0) maxVal = 100;

        // Draw axes
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();

        // Y-axis labels
        ctx.fillStyle = '#6b7280';
        ctx.font = '10px Segoe UI';
        ctx.textAlign = 'right';
        for (let i = 0; i <= 4; i++) {
            const y = padding + (chartHeight / 4) * i;
            const val = maxVal - (maxVal / 4) * i;
            ctx.fillText(this.shortNumber(val), padding - 5, y + 3);
            ctx.strokeStyle = '#f3f4f6';
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }

        // Bars
        const groupWidth = chartWidth / labels.length;
        const barWidth = groupWidth / (datasets.length + 1);

        labels.forEach((label, i) => {
            const groupX = padding + i * groupWidth;

            datasets.forEach((ds, dsIdx) => {
                const barX = groupX + (dsIdx + 0.5) * barWidth;
                const barHeight = (ds.data[i] / maxVal) * chartHeight;
                const barY = height - padding - barHeight;

                ctx.fillStyle = this.colors[dsIdx % this.colors.length];
                ctx.fillRect(barX, barY, barWidth * 0.8, barHeight);
            });

            // X label
            ctx.fillStyle = '#6b7280';
            ctx.font = '10px Segoe UI';
            ctx.textAlign = 'center';
            ctx.fillText(label, groupX + groupWidth / 2, height - padding + 15);
        });

        // Legend for datasets
        if (datasets.length > 1) {
            let legendX = padding;
            datasets.forEach((ds, i) => {
                ctx.fillStyle = this.colors[i % this.colors.length];
                ctx.fillRect(legendX, 10, 12, 12);
                ctx.fillStyle = '#1f2937';
                ctx.textAlign = 'left';
                ctx.font = '11px Segoe UI';
                ctx.fillText(ds.label, legendX + 16, 20);
                legendX += ctx.measureText(ds.label).width + 40;
            });
        }
    },

    shortNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'jt';
        if (num >= 1000) return (num / 1000).toFixed(0) + 'rb';
        return num.toFixed(0);
    }
};
