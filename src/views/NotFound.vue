<template>
  <div class="page-not-found">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-md-8 col-lg-6 text-center">
          <div class="fs-1 mb-3 text-danger">404</div>
          <h2 class="mb-4">Página No Encontrada</h2>
          <p class="mb-4">La página que está buscando no existe o ha sido movida.</p>
          <router-link to="/" class="btn btn-primary mt-3">
            <i class="fas fa-home me-2"></i>Volver al Inicio
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineOptions({
  name: 'NotFound'
})
</script>

<style scoped>
.page-not-found {
  min-height: 100vh;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-not-found .container {
  max-width: 600px;
  padding: 2rem;
  text-align: center;
}

.page-not-found .fs-1 {
  font-size: 8rem;
  font-weight: bold;
  color: #dc3545;
  margin-bottom: 1rem;
}

.page-not-found h2 {
  margin-bottom: 1rem;
  color: #333;
}

.page-not-found p {
  margin-bottom: 1.5rem;
  color: #666;
}

.page-not-found .btn-primary {
  margin-top: 1rem;
}
</style>