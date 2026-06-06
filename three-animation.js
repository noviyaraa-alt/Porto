let scene, camera, renderer, animationGroup;
let mouseX = 0, mouseY = 0;
let targetMouseX = 0, targetMouseY = 0; 
let currentMode = 'light';

let targetScrollPercent = 0;
let currentScrollPercent = 0;

// Sinkronisasi dengan pergerakan Lenis Scroll (diekspos secara global)
window.onSmoothScroll = function(progress) {
    targetScrollPercent = progress; 
}

function initThree() {
    const canvas = document.getElementById('three-canvas');
    if (!canvas) return; 
    
    // Cegah inisialisasi ganda jika fungsi dipanggil ulang
    if (renderer) {
        buildScene();
        return;
    }
    
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    animationGroup = new THREE.Group();
    scene.add(animationGroup);

    currentMode = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    buildScene();

    document.addEventListener('mousemove', (event) => {
        targetMouseX = (event.clientX / window.innerWidth) - 0.5;
        targetMouseY = (event.clientY / window.innerHeight) - 0.5;
    });

    window.addEventListener('resize', () => {
        if (!camera || !renderer) return;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    animate();
}

function buildScene() {
    if (!animationGroup) return;

    // Bersihkan objek lama & dealokasi memori secara bersih (Cegah Memory Leak)
    while(animationGroup.children.length > 0){ 
        const obj = animationGroup.children[0];
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
            if (Array.isArray(obj.material)) {
                obj.material.forEach(mat => mat.dispose());
            } else {
                obj.material.dispose();
            }
        }
        animationGroup.remove(obj); 
    }

    // Reset rotasi group ke nol agar transisi tema tidak melintir aneh
    animationGroup.rotation.set(0, 0, 0);

    if (currentMode === 'light') {
        // --- PRESET TEMA LIGHT MODE: SAKURA ---
        const petalCount = window.innerWidth < 768 ? 45 : 90; 
        const geometry = new THREE.SphereGeometry(0.09, 16, 16);
        geometry.scale(1.3, 0.7, 0.2); 
        
        const material = new THREE.MeshBasicMaterial({
            color: 0xFFB7C5, 
            transparent: true,
            opacity: 0.85,  
            side: THREE.DoubleSide
        });

        for (let i = 0; i < petalCount; i++) {
            const mesh = new THREE.Mesh(geometry, material);
            
            mesh.position.set(
                (Math.random() - 0.5) * 12,
                (Math.random() * 8) - 3,
                (Math.random() - 0.5) * 6
            );
            
            mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            
            mesh.userData = {
                speedY: 0.006 + Math.random() * 0.009,
                speedRotX: 0.005 + Math.random() * 0.01,
                speedRotY: 0.01 + Math.random() * 0.015,
                swayOffset: Math.random() * Math.PI * 2, 
                swaySpeed: 0.01 + Math.random() * 0.02    
            };
            
            animationGroup.add(mesh);
        }
    } else {
        // --- PRESET TEMA DARK MODE: KOSMIK GALAXY ---
        const starsCount = 120; 
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(starsCount * 3);
        const colors = new Float32Array(starsCount * 3);

        const colorPink = new THREE.Color('#E29595');
        const colorPurple = new THREE.Color('#8A5A8A');

        for (let i = 0; i < starsCount; i++) {
            const angle = (i / starsCount) * Math.PI * 5; 
            const radius = 0.4 + (i / starsCount) * 3.2;
            const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.3;
            const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.3;
            const y = (Math.random() - 0.5) * 0.2;

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            const mixedColor = colorPink.clone().lerp(colorPurple, radius / 4);
            colors[i * 3] = mixedColor.r;
            colors[i * 3 + 1] = mixedColor.g;
            colors[i * 3 + 2] = mixedColor.b;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.06,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });

        const galaxyPoints = new THREE.Points(geometry, material);
        animationGroup.add(galaxyPoints);
    }
}

function animate() {
    requestAnimationFrame(animate);
    if (!animationGroup || !renderer || !scene || !camera) return;

    // Interpolasi Scroll & Mouse (Smoothing effect)
    currentScrollPercent += (targetScrollPercent - currentScrollPercent) * 0.08;
    mouseX += (targetMouseX - mouseX) * 0.08;
    mouseY += (targetMouseY - mouseY) * 0.08;

    // Pergerakan kamera masuk kedalam objek 3D berdasarkan scroll progress Lenis
    const targetZ = 5 - (currentScrollPercent * 3.5);
    camera.position.z += (targetZ - camera.position.z) * 0.1; 

    if (currentMode === 'light') {
        // Animasi Jatuh bergoyang untuk Kelopak Sakura
        animationGroup.children.forEach(petal => {
            if(petal.userData && petal.position) {
                petal.position.y -= petal.userData.speedY;
                
                petal.userData.swayOffset += petal.userData.swaySpeed;
                petal.position.x += Math.sin(petal.userData.swayOffset) * 0.003;
                petal.position.z += Math.cos(petal.userData.swayOffset) * 0.002;
                
                petal.rotation.x += petal.userData.speedRotX;
                petal.rotation.y += petal.userData.speedRotY;

                if (petal.position.y < -4) {
                    petal.position.y = 4;
                    petal.position.x = (Math.random() - 0.5) * 12;
                    petal.position.z = (Math.random() - 0.5) * 6;
                }
            }
        });
        animationGroup.rotation.y += (mouseX * 0.12 - animationGroup.rotation.y) * 0.05;
    } else {
        // Animasi Rotasi konstelasi Galaksi Kosmik
        if (animationGroup.children[0]) {
            animationGroup.children[0].rotation.y += 0.002;
        }
        animationGroup.rotation.x += (-mouseY * 0.2 - animationGroup.rotation.x) * 0.05;
        animationGroup.rotation.z += (mouseX * 0.1 - animationGroup.rotation.z) * 0.05;
    }

    renderer.render(scene, camera);
}

// Pemicu pergantian mode real-time saat tombol navbar diklik (ekspos ke window)
window.updateParticleColor = function() {
    const isDarkNow = document.documentElement.classList.contains('dark');
    const newMode = isDarkNow ? 'dark' : 'light';
    
    if (newMode !== currentMode) {
        currentMode = newMode;
        buildScene();
    }
}

// Ekspos inisialisasi utama ke cakupan global agar bisa dipicu tepat waktu oleh script.js
window.initThreeAnimation = initThree;