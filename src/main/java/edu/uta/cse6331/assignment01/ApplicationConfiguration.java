package edu.uta.cse6331.assignment01;

import org.apache.tomcat.util.http.fileupload.IOUtils;
import org.springframework.beans.factory.annotation.Configurable;
import org.springframework.cache.CacheManager;
import org.springframework.cache.concurrent.ConcurrentMapCache;
import org.springframework.cache.support.SimpleCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpInputMessage;
import org.springframework.http.HttpOutputMessage;
import org.springframework.http.MediaType;
import org.springframework.http.converter.AbstractHttpMessageConverter;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.http.converter.HttpMessageNotWritableException;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.orm.jpa.JpaVendorAdapter;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Configuration
public class ApplicationConfiguration implements WebMvcConfigurer {

    @Bean("fixedThreadPool")
    public ExecutorService fixedThreadPool() {
        return Executors.newFixedThreadPool(5);
    }

    @Override
    public void configureMessageConverters(
            List<HttpMessageConverter<?>> converters) {
        converters.add(addOctetStreamConverter());
    }

    @Bean
    public JpaVendorAdapter jpaVendorAdapter(){
        HibernateJpaVendorAdapter jpaVendorAdapter = new HibernateJpaVendorAdapter();
        jpaVendorAdapter.setGenerateDdl(true);
        jpaVendorAdapter.setShowSql(true);
        jpaVendorAdapter.getJpaPropertyMap().put("hibernate.generate_statistics", "true");
        return jpaVendorAdapter;
    }

    @Bean
    public HttpMessageConverter addOctetStreamConverter() {
        return new AbstractHttpMessageConverter<ByteArrayInputStream>(MediaType.APPLICATION_OCTET_STREAM) {
            protected boolean supports(Class<?> clazz) {
                return ByteArrayInputStream.class.isAssignableFrom(clazz);
            }

            protected ByteArrayInputStream readInternal(Class<? extends ByteArrayInputStream> clazz, HttpInputMessage inputMessage) throws IOException, HttpMessageNotReadableException {
                return (ByteArrayInputStream)inputMessage.getBody();
            }

            protected void writeInternal(ByteArrayInputStream inputStream, HttpOutputMessage outputMessage) throws IOException, HttpMessageNotWritableException {
                IOUtils.copy(inputStream, outputMessage.getBody());
            }
        };
    }

}
