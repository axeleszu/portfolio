export class SignalScope {
    constructor(wrapperSelector = '.signal-scope-wrapper') {
        this.wrapper = document.querySelector(wrapperSelector);
        if (!this.wrapper) {
            console.warn('SignalScope: Wrapper not found');
            return;
        }

        this.svg = this.wrapper.querySelector('.signal-scope-svg');
        this.statusText = this.wrapper.querySelector('.status-text');
        this.toggles = this.wrapper.querySelectorAll('.scope-toggle');

        this.stereoActive = false;
        this.activeLayers = new Set();

        this.init();
    }

    init() {
        this.generateSpectrumBars();
        this.activateLayer('wave');

        this.toggles.forEach(toggle => {
            toggle.addEventListener('click', () => this.handleToggle(toggle));
        });

        document.addEventListener('modeChanged', (e) => {
            if (e.detail.mode === 'media') {
                this.reset();
            }
        });
    }

    handleToggle(toggle) {
        const layer = toggle.dataset.layer;

        if (layer !== 'stereo' && this.activeLayers.has(layer) && !this.stereoActive) {
            return;
        }

        const isActive = toggle.getAttribute('aria-pressed') === 'true';

        toggle.setAttribute('aria-pressed', !isActive);

        if (layer === 'stereo') {
            this.stereoActive = !isActive;
            this.handleStereoToggle(this.stereoActive);
        } else {

            const layerElement = this.svg.querySelector(`.layer-${layer}`);
            if (layerElement) {
                layerElement.setAttribute('opacity', isActive ? '0' : '0.8');
                if (!isActive) {
                    this.activeLayers.add(layer);
                } else {
                    this.activeLayers.delete(layer);
                }
            }
        }

        this.updateStatus(layer, !isActive);
    }

    handleStereoToggle(active) {
        const stereoWaveLayer = this.svg.querySelector('.layer-stereo');
        const stereoSpectrumLayer = this.svg.querySelector('.layer-spectrum-stereo');
        const monoWaveLayer = this.svg.querySelector('.layer-wave');
        const monoSpectrumLayer = this.svg.querySelector('.layer-spectrum');

        if (active) {
            stereoWaveLayer.setAttribute('opacity', '0.8');
            stereoSpectrumLayer.setAttribute('opacity', '0.8');
            monoWaveLayer.setAttribute('opacity', '0');
            monoSpectrumLayer.setAttribute('opacity', '0');

            this.generateStereoSpectrum();
        } else {

            stereoWaveLayer.setAttribute('opacity', '0');
            stereoSpectrumLayer.setAttribute('opacity', '0');

            const waveToggle = this.wrapper.querySelector('[data-layer="wave"]');
            const spectrumToggle = this.wrapper.querySelector('[data-layer="spectrum"]');

            if (waveToggle && waveToggle.getAttribute('aria-pressed') === 'true') {
                monoWaveLayer.setAttribute('opacity', '0.8');
            }
            if (spectrumToggle && spectrumToggle.getAttribute('aria-pressed') === 'true') {
                monoSpectrumLayer.setAttribute('opacity', '0.8');
            }
        }
    }

    updateStatus(layer, active) {
        if (this.activeLayers.size === 0 && !this.stereoActive) {
            this.statusText.textContent = '> STANDBY';
            this.statusText.style.color = 'rgba(255,255,255,0.5)';
        } else {
            const statusMap = {
                wave: 'WAVEFORM',
                spectrum: 'SPECTRUM',
                filter: 'FILTER_CHAIN',
                stereo: this.stereoActive ? 'STEREO_DUAL' : 'MONO'
            };

            if (active && layer !== 'stereo') {
                this.statusText.textContent = `> ${statusMap[layer]}_ACTIVE`;
                this.statusText.style.color = 'var(--accent-color)';
            } else if (layer === 'stereo') {
                this.statusText.textContent = this.stereoActive
                    ? '> STEREO_DUAL_ACTIVE'
                    : '> MONO_ACTIVE';
                this.statusText.style.color = 'var(--accent-color)';
            } else {
                const lastActive = Array.from(this.activeLayers).pop() || 'stereo';
                this.statusText.textContent = `> ${statusMap[lastActive] || 'STEREO'}_ACTIVE`;
                this.statusText.style.color = 'var(--accent-color)';
            }
        }
    }

    generateSpectrumBars() {
        const spectrumGroup = this.svg.querySelector('.layer-spectrum');
        if (!spectrumGroup) return;

        spectrumGroup.innerHTML = '';

        for (let i = 0; i < 25; i++) {
            const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            bar.setAttribute('class', 'spec-bar');
            bar.setAttribute('x', 80 + (i * 26));
            bar.setAttribute('width', 10);
            const height = 60 + Math.random() * 40;
            bar.setAttribute('height', height);
            bar.setAttribute('y', 200 - height);
            bar.setAttribute('fill', 'var(--accent-color)');
            bar.setAttribute('opacity', '0.6');
            bar.style.animationDelay = `${i * 0.08}s`;
            spectrumGroup.appendChild(bar);
        }
    }

    generateStereoSpectrum() {
        const stereoSpectrumGroup = this.svg.querySelector('.layer-spectrum-stereo');
        if (!stereoSpectrumGroup) return;

        const leftGroup = stereoSpectrumGroup.querySelector('.spectrum-left');
        const rightGroup = stereoSpectrumGroup.querySelector('.spectrum-right');
        if (leftGroup) leftGroup.innerHTML = '';
        if (rightGroup) rightGroup.innerHTML = '';

        for (let i = 0; i < 12; i++) {
            const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            bar.setAttribute('class', 'spec-bar-stereo');
            bar.setAttribute('x', 80 + (i * 50));
            bar.setAttribute('width', 10);
            const height = 40 + Math.random() * 30;
            bar.setAttribute('height', height);
            bar.setAttribute('y', 140 - height);
            bar.setAttribute('fill', 'var(--accent-color)');
            bar.setAttribute('opacity', '0.7');
            bar.style.animationDelay = `${i * 0.1}s`;
            leftGroup.appendChild(bar);
        }

        for (let i = 0; i < 12; i++) {
            const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            bar.setAttribute('class', 'spec-bar-stereo');
            bar.setAttribute('x', 80 + (i * 50));
            bar.setAttribute('width', 10);
            const height = 40 + Math.random() * 30;
            bar.setAttribute('height', height);
            bar.setAttribute('y', 210);
            bar.setAttribute('fill', 'var(--accent-color)');
            bar.setAttribute('opacity', '0.7');
            bar.style.animationDelay = `${i * 0.1 + 0.5}s`;
            rightGroup.appendChild(bar);
        }
    }

    activateLayer(layer) {
        const toggle = this.wrapper.querySelector(`[data-layer="${layer}"]`);
        const layerElement = this.svg.querySelector(`.layer-${layer}`);

        if (toggle) toggle.setAttribute('aria-pressed', 'true');
        if (layerElement) layerElement.setAttribute('opacity', '0.8');

        this.activeLayers.add(layer);
        this.updateStatus(layer, true);
    }

    reset() {
        this.toggles.forEach(toggle => {
            toggle.setAttribute('aria-pressed', 'false');
        });

        this.svg.querySelectorAll('.layer-wave, .layer-spectrum, .layer-stereo, .layer-spectrum-stereo, .layer-filter').forEach(layer => {
            layer.setAttribute('opacity', '0');
        });

        this.stereoActive = false;
        this.activeLayers.clear();

        this.generateSpectrumBars();

        this.statusText.textContent = '> STANDBY';
        this.statusText.style.color = 'rgba(255,255,255,0.5)';
    }

    destroy() {
        this.toggles.forEach(toggle => {
            toggle.replaceWith(toggle.cloneNode(true));
        });
    }
}