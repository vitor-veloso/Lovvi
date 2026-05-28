package com.lovvi.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record UsuarioPerfil(
        int idUsuario,
        String nome,
        String sobrenome,
        String email,
        String cidade,
        String genero,
        String generoInteresse,
        LocalDate dtNascimento,
        String descricao,
        String preferencias,
        String objetivos,
        String tipoPerfil,
        BigDecimal altura,
        List<Integer> interesses
) {
}
