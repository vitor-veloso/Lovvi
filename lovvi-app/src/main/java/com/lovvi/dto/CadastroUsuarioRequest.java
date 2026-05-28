package com.lovvi.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record CadastroUsuarioRequest(
        String nome,
        String sobrenome,
        String email,
        String senha,
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
